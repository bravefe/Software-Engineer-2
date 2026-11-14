"""Public deployment checks. Credentials/tokens are never printed.

WHAT THIS SCRIPT DOES
    Called by .github/workflows/deploy.yml after a deployment:
        python3 deploy/smoke_test.py SERVICE_URL
    It checks the live service and exits non-zero (failing the workflow) if any
    check fails. Each public check is retried up to 5 times, 3 seconds apart, to
    tolerate Cloud Run cold starts.

    Checks (in order)
      1. GET /api/health -> {"status": "ok", "database": "connected"}
      2. GET /api/ready  -> {"status": "ok", "database": "connected"}
      3. GET /           -> HTML page (the built React app is served)
      4. OPTIONAL login test -> login, /api/auth/me, logout. Runs only if BOTH
         env vars SMOKE_EMAIL and SMOKE_PASSWORD are set (set both or neither).
         The session cookie is always cleared, even if a check fails.

IMPORTANT
    Uses only the Python standard library (no pip install needed).
    Offline unit tests: deploy/tests/test_smoke.py

REFERENCES
    - urllib.request : https://docs.python.org/3/library/urllib.request.html
    - unittest.mock  : https://docs.python.org/3/library/unittest.mock.html

    The health endpoint checks the database itself. Authentication uses an
    HTTP-only cookie; this script keeps that cookie between login/me/logout.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request


# --- HTTP helper --------------------------------------------------------------
# Returns the response body (bytes). Raises on HTTP errors / timeouts.
def request(base, path, data=None, opener=None):
    headers = {}
    if data is not None:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(base + path, headers=headers,
        data=json.dumps(data).encode() if data is not None else None)
    open_request = opener.open if opener else urllib.request.urlopen
    with open_request(req, timeout=30) as response:
        return response.read()


def check(base):
    # Both endpoints report database connectivity; readiness is checked
    # explicitly so deploys verify the endpoint used by platform probes.
    def database_is_healthy(body):
        health = json.loads(body)
        return (
            isinstance(health, dict)
            and health.get('status') == 'ok'
            and health.get('database') == 'connected'
        )

    for path, predicate in (
        ('/api/health', database_is_healthy),
        ('/api/ready', database_is_healthy),
        ('/', lambda b: b'<html' in b.lower()),
    ):
        # Retry: a cold Cloud Run instance may need a few seconds to start.
        for attempt in range(5):
            try:
                if not predicate(request(base, path)):
                    raise ValueError('Unexpected response')
                break
            except (urllib.error.URLError, TimeoutError, ValueError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)

    # --- Optional login check (only when both credentials are provided) -------
    email, password = os.getenv('SMOKE_EMAIL'), os.getenv('SMOKE_PASSWORD')
    if bool(email) != bool(password):
        raise RuntimeError('Set both SMOKE_EMAIL and SMOKE_PASSWORD, or neither.')
    if not email:
        print('SKIP login: optional smoke credentials not configured')
        return
    cookie_opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor()
    )
    try:
        login = json.loads(request(
            base,
            '/api/auth/login',
            {'email': email, 'password': password},
            opener=cookie_opener,
        ))
        login_user = login.get('user') if isinstance(login, dict) else None
        if (
            not isinstance(login_user, dict)
            or not isinstance(login_user.get('email'), str)
            or login_user['email'].lower() != email.strip().lower()
        ):
            raise ValueError('Login response did not contain a user')
        current_user = json.loads(request(
            base,
            '/api/auth/me',
            opener=cookie_opener,
        ))
        current_profile = (
            current_user.get('user') if isinstance(current_user, dict) else None
        )
        if (
            not isinstance(current_profile, dict)
            or not isinstance(current_profile.get('email'), str)
            or current_profile['email'].lower() != email.strip().lower()
        ):
            raise ValueError('Current-user response did not contain a user')
        print('PASS login and authenticated /api/auth/me')
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
        raise RuntimeError('Login smoke check failed') from None
    finally:
        # Always end the session, even when a check above failed.
        request(base, '/api/auth/logout', data={}, opener=cookie_opener)
        print('PASS logout')


# --- Entry point ----------------------------------------------------------------
if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL')
    check(sys.argv[1].rstrip('/'))
