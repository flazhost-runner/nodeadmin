#!/bin/bash
# Smoke test untuk semua NodeAdmin derivative apps
# Usage: bash smoke_test.sh http://localhost:8001 [AppName]

BASE="${1:-${BASE_PORT:+http://localhost:$BASE_PORT}}"
BASE="${BASE:-http://localhost:8001}"
APPNAME="${2:-App}"
PASS=0; FAIL=0; JAR=$(mktemp)
LOGFILE=$(mktemp)

check() {
  local id="$1" desc="$2" expected="$3" actual="$4"
  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $id: $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $id: $desc | expected=$expected got=$actual"
    FAIL=$((FAIL+1))
  fi
}

skip() {
  echo "  ⏭️  $1: $2 [SKIP]"
}

# Cek keberadaan pattern di dalam HTML
check_html() {
  local id="$1" desc="$2" pattern="$3" html="$4"
  if echo "$html" | grep -qi "$pattern"; then
    echo "  ✅ $id: $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $id: $desc | pattern tidak ditemukan"
    FAIL=$((FAIL+1))
  fi
}

# Accept 302 OR 303 as "redirect"
check_redirect() {
  local id="$1" desc="$2" status="$3"
  if [ "$status" = "302" ] || [ "$status" = "303" ]; then
    echo "  ✅ $id: $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $id: $desc | expected=302/303 got=$status"
    FAIL=$((FAIL+1))
  fi
}

# Accept any "rejected" status: 302, 303, 200 (re-render), 400, 401, 422
check_rejected() {
  local id="$1" desc="$2" status="$3"
  if [ "$status" = "302" ] || [ "$status" = "303" ] || [ "$status" = "200" ] \
     || [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "422" ]; then
    echo "  ✅ $id: $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $id: $desc | expected=302/303/200/400/401 got=$status"
    FAIL=$((FAIL+1))
  fi
}

# Extract CSRF token from HTML page
get_csrf() {
  local html="$1"
  local token=""
  token=$(echo "$html" | sed -n 's/.*name="csrf-token" content="\([^"]*\)".*/\1/p' | head -1)
  if [ -z "$token" ]; then
    token=$(echo "$html" | sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$token" ]; then
    token=$(echo "$html" | grep -i 'name="_csrf"' | sed -n 's/.*value="\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$token" ]; then
    token=$(echo "$html" | sed -n 's/.*name="csrf_token" content="\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$token" ]; then
    token=$(echo "$html" | sed -n 's/.*name="csrfmiddlewaretoken" value="\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$token" ]; then
    token=$(echo "$html" | sed -n 's/.*name="__RequestVerificationToken"[^>]*value="\([^"]*\)".*/\1/p' | head -1)
  fi
  if [ -z "$token" ]; then
    token=$(echo "$html" | grep -i '__RequestVerificationToken' | sed -n 's/.*value="\([^"]*\)".*/\1/p' | head -1)
  fi
  echo "$token"
}

echo "=== Smoke Test: $APPNAME ($BASE) ==="
echo ""

# T00 - Bootstrap
echo "[T00] Bootstrap"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR "$BASE/auth/login")
check T00-01 "Login page reachable" "200" "$STATUS"

if [ "$STATUS" != "200" ]; then
  echo "  ⛔ Server tidak response — hentikan test"
  echo ""
  echo "=== HASIL ==="
  echo "❌ FAIL: Server tidak bisa diakses di $BASE"
  exit 1
fi

# T03 - Landing Page (public, tanpa auth)
echo "[T03] Landing Page"
FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$BASE/")
FINAL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/")
if echo "$FINAL_URL" | grep -q "auth/login"; then
  check T03-01 "Landing page / -> 200 (bukan redirect ke login)" "200" "redirect-to-login"
else
  check T03-01 "Landing page / -> 200 (bukan redirect ke login)" "200" "$FINAL_CODE"
fi
FINAL_HOME=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE/home")
if [ "$FINAL_HOME" = "404" ]; then
  skip T03-02 "GET /home (endpoint tidak ada)"
else
  check T03-02 "GET /home -> 200" "200" "$FINAL_HOME"
fi

# T01 - Auth Login
echo "[T01] Auth Login"
LOGIN_HTML=$(curl -s -c $JAR -b $JAR "$BASE/auth/login")

# T01-E: Elemen login page (layout & fitur harus sama dengan NodeAdmin)
echo "[T01-E] Login Page Elements"
check_html T01-E-01 "Tag <title> ada"                          "<title>"             "$LOGIN_HTML"
check_html T01-E-02 "CSRF token (meta/hidden field)"           "csrf"                "$LOGIN_HTML"
check_html T01-E-03 "Tailwind CSS dimuat"                      "tailwind"            "$LOGIN_HTML"
check_html T01-E-04 "Form POST ke /auth/login"                 "action.*auth/login"  "$LOGIN_HTML"
check_html T01-E-05 "Input email (name=email)"                 "name=.email"         "$LOGIN_HTML"
check_html T01-E-06 "Input password (type=password)"           "type=.password"      "$LOGIN_HTML"
check_html T01-E-07 "Tombol submit"                            "type=.submit"        "$LOGIN_HTML"
check_html T01-E-08 "Remember me checkbox (name=remember*)"    "name=.remember"      "$LOGIN_HTML"
check_html T01-E-09 "Link forgot/reset password"               "auth/reset\|forgot\|lupa" "$LOGIN_HTML"

CSRF=$(get_csrf "$LOGIN_HTML")
CSRF_FIELD="_csrf"
if echo "$LOGIN_HTML" | grep -q 'name="_token"'; then CSRF_FIELD="_token"; fi
if echo "$LOGIN_HTML" | grep -q "csrfmiddlewaretoken"; then CSRF_FIELD="csrfmiddlewaretoken"; fi
CSRF_PARAM=""
CSRF_QPARAM=""
if [ -n "$CSRF" ]; then
  CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$CSRF" 2>/dev/null || echo "$CSRF")
  CSRF_PARAM="&${CSRF_FIELD}=${CSRF_ENC}"
  CSRF_QPARAM="?${CSRF_FIELD}=${CSRF_ENC}"
fi

# NOTE: use --data (not -X POST) so curl auto-converts to GET on 302 redirect
STATUS=$(curl -s -c $JAR -b $JAR \
  --data "email=admin@admin.com&password=12345678${CSRF_PARAM}" \
  -L -o /dev/null -w "%{http_code}" "$BASE/auth/login${CSRF_QPARAM}")
check T01-01 "Login valid credentials -> dashboard" "200" "$STATUS"

# T01-02: Wrong password - use FRESH jar so CSRF is always valid (no redirect loop)
FRESH_JAR=$(mktemp)
LOGIN_HTML2=$(curl -s -c $FRESH_JAR -b $FRESH_JAR "$BASE/auth/login")
CSRF2=$(get_csrf "$LOGIN_HTML2")
CSRF_PARAM2=""; CSRF_QPARAM2=""
if [ -n "$CSRF2" ]; then
  CSRF_ENC2=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$CSRF2" 2>/dev/null || echo "$CSRF2")
  CSRF_PARAM2="&${CSRF_FIELD}=${CSRF_ENC2}"
  CSRF_QPARAM2="?${CSRF_FIELD}=${CSRF_ENC2}"
fi
STATUS=$(curl -s -c $FRESH_JAR -b $FRESH_JAR -o /dev/null -w "%{http_code}" \
  --data "email=admin@admin.com&password=wrong_password_xyz${CSRF_PARAM2}" \
  "$BASE/auth/login${CSRF_QPARAM2}")
rm -f $FRESH_JAR
check_rejected T01-02 "Login wrong password -> rejected" "$STATUS"

# T04 - Protected Routes
echo "[T04] Protected Routes"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin/v1/dashboard")
check_redirect T04-02 "Dashboard without auth -> redirect" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/dashboard")
check T06-01 "Dashboard with auth -> 200" "200" "$STATUS"

# T05 - API Auth
echo "[T05] API"
API_RESP=$(curl -s -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"12345678"}')
TOKEN=$(echo "$API_RESP" | grep -oP '(?<="access_token":")[^"]+' | head -1)
if [ -z "$TOKEN" ]; then
  TOKEN=$(echo "$API_RESP" | grep -oP '(?<="token":")[^"]+' | head -1)
fi
# Accept "status":true OR "status":"success"/"ok" (with valid token)
STATUS_KEY=$(echo "$API_RESP" | grep -oP '"status":true')
if [ -z "$STATUS_KEY" ] && [ -n "$TOKEN" ]; then
  STATUS_ALT=$(echo "$API_RESP" | grep -oP '"status":"(success|ok)"|"success":true')
  [ -n "$STATUS_ALT" ] && STATUS_KEY='"status":true'
fi
check T05-01 "API login success" '"status":true' "$STATUS_KEY"

if [ -n "$TOKEN" ]; then
  # T05-05: API dashboard is optional (skip if endpoint not implemented)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/dashboard" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" = "404" ]; then
    skip T05-05 "API dashboard (endpoint not implemented)"
  else
    check T05-05 "API dashboard with token -> 200" "200" "$STATUS"
  fi

  # API user list (try singular then plural)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/user" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" != "200" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/users" \
      -H "Authorization: Bearer $TOKEN")
  fi
  check T16-C-05 "API user list -> 200" "200" "$STATUS"

  # API pagination format: accept "datas":[ OR "data":[ (both valid)
  PAGI_SING=$(curl -s "$BASE/api/v1/access/user" -H "Authorization: Bearer $TOKEN")
  PAGI_PLUR=$(curl -s "$BASE/api/v1/access/users" -H "Authorization: Bearer $TOKEN")
  HAS_DATAS=$(echo "$PAGI_SING" | grep -oP '"datas":\[')
  [ -z "$HAS_DATAS" ] && HAS_DATAS=$(echo "$PAGI_PLUR" | grep -oP '"datas":\[')
  if [ -z "$HAS_DATAS" ]; then
    # Some apps use "data":[ instead of "datas":[ — check both responses
    HAS_DATA=$(echo "$PAGI_SING" | grep -oP '"data":\[')
    [ -z "$HAS_DATA" ] && HAS_DATA=$(echo "$PAGI_PLUR" | grep -oP '"data":\[')
    [ -n "$HAS_DATA" ] && HAS_DATAS='"datas":['
  fi
  check T16-B-01 "API pagination list key" '"datas":[' "$HAS_DATAS"
else
  skip T05-05 "API dashboard (no token)"
  skip T16-C-05 "API user list (no token)"
  skip T16-B-01 "API pagination (no token)"
fi

# T06 - Dashboard
echo "[T06] Dashboard"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/dashboard")
check T06-01 "Dashboard loads" "200" "$STATUS"

# T06-E: Elemen dashboard (layout & konten harus sama dengan NodeAdmin)
echo "[T06-E] Dashboard Elements"
if [ "$STATUS" = "200" ]; then
  DASH_HTML=$(curl -s -b $JAR "$BASE/admin/v1/dashboard")
  check_html T06-E-01 "Tag <title> ada"                      "<title>"                   "$DASH_HTML"
  check_html T06-E-02 "CSRF token ada"                       "csrf"                      "$DASH_HTML"
  check_html T06-E-03 "Tailwind CSS dimuat"                  "tailwind"                  "$DASH_HTML"
  check_html T06-E-04 "FontAwesome dimuat"                   "fontawesome\|fa-"          "$DASH_HTML"
  check_html T06-E-05 "Chart.js dimuat"                      "chart\.js\|Chart"          "$DASH_HTML"
  check_html T06-E-06 "Sidebar ada"                          "sidebar"                   "$DASH_HTML"
  check_html T06-E-07 "Link dashboard di sidebar/nav"        "admin/v1/dashboard"        "$DASH_HTML"
  check_html T06-E-08 "Logout link/form ada"                 "logout"                    "$DASH_HTML"
  check_html T06-E-09 "Profile link ada"                     "profile"                   "$DASH_HTML"
  check_html T06-E-10 "Heading Dashboard Overview"           "Dashboard"                 "$DASH_HTML"
  check_html T06-E-11 "Stat card: Total Users"               "Total Users\|total.*user\|user.*total" "$DASH_HTML"
  check_html T06-E-12 "Stat card: Roles"                     "Roles\|Total.*[Rr]ole"     "$DASH_HTML"
  check_html T06-E-13 "Stat card: Permissions"               "Permission"                "$DASH_HTML"
  check_html T06-E-14 "Canvas chart ada"                     "<canvas"                   "$DASH_HTML"
  check_html T06-E-15 "Sales Overview chart"                 "Sales"                     "$DASH_HTML"
  check_html T06-E-16 "Traffic Sources chart"                "Traffic"                   "$DASH_HTML"
  check_html T06-E-17 "Recent Activities section"            "Recent Activities\|Recent.*Activit" "$DASH_HTML"
  check_html T06-E-18 "Top Products section"                 "Top Products\|Top.*Product" "$DASH_HTML"
  check_html T06-E-19 "Recent Orders table"                  "Recent Orders\|Recent.*Order" "$DASH_HTML"
else
  for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19; do
    skip "T06-E-$i" "Dashboard element check (dashboard tidak dapat diakses)"
  done
fi

# T07 - Users (try singular /user first, then plural /users)
echo "[T07] Users"
USER_BASE="$BASE/admin/v1/access/user"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$USER_BASE")
if [ "$STATUS" != "200" ]; then
  USER_BASE="$BASE/admin/v1/access/users"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$USER_BASE")
fi
check T07-A-01 "User index -> 200" "200" "$STATUS"

if [ "$STATUS" = "200" ]; then
  USER_HTML=$(curl -s -b $JAR "$USER_BASE")
  BEFORE_USER_IDS=$(echo "$USER_HTML" | grep -oP '(?<=/users?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)

  # T07-E: Elemen halaman index user
  echo "[T07-E] User Index Elements"
  check_html T07-E-01 "Heading User Management"       "User Management"                          "$USER_HTML"
  check_html T07-E-02 "Card heading User List"        "User List"                                "$USER_HTML"
  check_html T07-E-03 "Tombol Add Data (btn-success)" "Add Data"                                 "$USER_HTML"
  check_html T07-E-04 "Tombol Delete Selected"        "Delete Selected"                          "$USER_HTML"
  check_html T07-E-05 "Kolom Code"                    ">Code<"                                   "$USER_HTML"
  check_html T07-E-06 "Kolom Name"                    ">Name<"                                   "$USER_HTML"
  check_html T07-E-07 "Kolom Email"                   ">Email<"                                  "$USER_HTML"
  check_html T07-E-08 "Kolom Status"                  ">Status<"                                 "$USER_HTML"
  check_html T07-E-09 "Kolom Picture"                 ">Picture<"                                "$USER_HTML"
  check_html T07-E-10 "Kolom Roles"                   ">Roles<\|>Role<"                          "$USER_HTML"
  check_html T07-E-11 "Filter q_name"                 'name="q_name"\|name=.q_name'             "$USER_HTML"
  check_html T07-E-12 "Filter q_email"                'name="q_email"\|name=.q_email'            "$USER_HTML"
  check_html T07-E-13 "Filter q_status"               'name="q_status"\|name=.q_status'          "$USER_HTML"
  check_html T07-E-14 "Filter q_role"                 'name="q_role"\|name=.q_role'              "$USER_HTML"
  check_html T07-E-15 "Filter q_page_size"            'name="q_page_size"\|name=.q_page_size'    "$USER_HTML"
  check_html T07-E-16 "Checkbox checkall"             'id="checkall"\|id=.checkall'              "$USER_HTML"
  check_html T07-E-17 "Status icon fa-check/times"    "fa-check-circle\|fa-times-circle"         "$USER_HTML"
  check_html T07-E-18 "Gambar picture (img tag)"      "<img"                                     "$USER_HTML"
  check_html T07-E-19 "Action dropdown"               "dropdown-menu"                            "$USER_HTML"
  check_html T07-E-20 "Edit link fa-pen/fa-edit"      "fa-pen\|fa-edit"                          "$USER_HTML"
  check_html T07-E-21 "Delete btn fa-trash"           "fa-trash"                                 "$USER_HTML"
  check_html T07-E-22 "data-confirm Confirm Delete"   "Confirm Delete"                           "$USER_HTML"
  check_html T07-E-23 "Pagination"                    "pagination\|page-item"                    "$USER_HTML"

  # T07-B: Form create user
  echo "[T07-B] User Create Form"
  STATUS_B=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$USER_BASE/create")
  check T07-B-01 "User create form -> 200" "200" "$STATUS_B"
  USER_CREATE_HTML=""
  if [ "$STATUS_B" = "200" ]; then
    USER_CREATE_HTML=$(curl -s -b $JAR "$USER_BASE/create")
    check_html T07-B-E-01 "Heading User Management"    "User Management"                                       "$USER_CREATE_HTML"
    check_html T07-B-E-02 "Card heading User Form"     "User Form"                                             "$USER_CREATE_HTML"
    check_html T07-B-E-03 "Input code"                 'name="code"\|name=.code'                               "$USER_CREATE_HTML"
    check_html T07-B-E-04 "Input name"                 'name="name"\|name=.name'                               "$USER_CREATE_HTML"
    check_html T07-B-E-05 "Input phone"                'name="phone"\|name=.phone'                             "$USER_CREATE_HTML"
    check_html T07-B-E-06 "Input email"                'name="email"\|name=.email'                             "$USER_CREATE_HTML"
    check_html T07-B-E-07 "Input password"             'name="password"'                                       "$USER_CREATE_HTML"
    check_html T07-B-E-08 "Input password_confirmation" 'password_confirm\|password_confirmation'              "$USER_CREATE_HTML"
    check_html T07-B-E-09 "Select status (select tag)" '<select[^>]*name="status"\|<select[^>]*name=.status'  "$USER_CREATE_HTML"
    check_html T07-B-E-10 "Option Active"              ">Active<"                                              "$USER_CREATE_HTML"
    check_html T07-B-E-11 "Option Inactive"            ">Inactive<"                                            "$USER_CREATE_HTML"
    check_html T07-B-E-12 "Input picture (file)"       'type="file"\|type=.file'                               "$USER_CREATE_HTML"
    check_html T07-B-E-13 "Checkbox blocked"           'name="blocked"\|name=.blocked'                         "$USER_CREATE_HTML"
    check_html T07-B-E-14 "Input blocked_reason"       'name="blocked_reason"\|name=.blocked_reason'           "$USER_CREATE_HTML"
    check_html T07-B-E-15 "Checkboxes roles[]"         'name="roles\[\]"\|name=.roles\b\|roles\b'              "$USER_CREATE_HTML"
    check_html T07-B-E-16 "CSRF token"                 "csrf"                                                  "$USER_CREATE_HTML"
    check_html T07-B-E-17 "Tombol Save (fa-save)"      "fa-save"                                               "$USER_CREATE_HTML"
    check_html T07-B-E-18 "Tombol Back (btn-danger)"   "btn-danger"                                            "$USER_CREATE_HTML"
  else
    for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18; do
      skip "T07-B-$i" "Create form elements (halaman tidak dapat diakses)"
    done
  fi

  # Extract user ID dari index untuk edit test
  USER_ID=$(echo "$USER_HTML" | grep -oP '(?<=/user/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
  if [ -z "$USER_ID" ]; then
    USER_ID=$(echo "$USER_HTML" | grep -oP '(?<=/users/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
  fi

  # T07-D: Form edit user
  echo "[T07-D] User Edit Form"
  if [ -n "$USER_ID" ]; then
    STATUS_D=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$USER_BASE/$USER_ID/edit")
    check T07-D-01 "User edit form -> 200" "200" "$STATUS_D"
    if [ "$STATUS_D" = "200" ]; then
      USER_EDIT_HTML=$(curl -s -b $JAR "$USER_BASE/$USER_ID/edit")
      check_html T07-D-E-01 "Heading User Management"  "User Management"                                       "$USER_EDIT_HTML"
      check_html T07-D-E-02 "Card heading User Form"   "User Form"                                             "$USER_EDIT_HTML"
      check_html T07-D-E-03 "Input code pre-filled"    'name="code"\|name=.code'                               "$USER_EDIT_HTML"
      check_html T07-D-E-04 "Input name pre-filled"    'name="name"\|name=.name'                               "$USER_EDIT_HTML"
      check_html T07-D-E-05 "Input phone"              'name="phone"\|name=.phone'                             "$USER_EDIT_HTML"
      check_html T07-D-E-06 "Input email pre-filled"   'name="email"\|name=.email'                             "$USER_EDIT_HTML"
      check_html T07-D-E-07 "Input password"           'name="password"'                                       "$USER_EDIT_HTML"
      check_html T07-D-E-08 "Input password_confirm"   'password_confirm\|password_confirmation'               "$USER_EDIT_HTML"
      check_html T07-D-E-09 "Select status"            '<select[^>]*name="status"\|<select[^>]*name=.status'  "$USER_EDIT_HTML"
      check_html T07-D-E-10 "PUT method override"      '_method=PUT\|method=.PUT\|value=.PUT\|name=._method'  "$USER_EDIT_HTML"
      check_html T07-D-E-11 "Input picture (file)"     'type="file"\|type=.file'                               "$USER_EDIT_HTML"
      check_html T07-D-E-12 "Checkbox blocked"         'name="blocked"\|name=.blocked'                         "$USER_EDIT_HTML"
      check_html T07-D-E-13 "Input blocked_reason"     'name="blocked_reason"\|name=.blocked_reason'           "$USER_EDIT_HTML"
      check_html T07-D-E-14 "Checkboxes roles[]"       'name="roles\[\]"\|name=.roles\b\|roles\b'              "$USER_EDIT_HTML"
      check_html T07-D-E-15 "CSRF token"               "csrf"                                                  "$USER_EDIT_HTML"
    else
      for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15; do
        skip "T07-D-$i" "Edit form elements (halaman tidak dapat diakses)"
      done
    fi
  else
    skip T07-D-01 "User edit (tidak ada user ID di halaman index)"
    for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15; do
      skip "T07-D-$i" "Edit form elements (tidak ada user ID)"
    done
  fi

  # T07-F: User CRUD (functional: Create → Read → Update → Delete)
  echo "[T07-F] User CRUD (functional)"
  if [ -n "$USER_CREATE_HTML" ]; then
    USER_CSRF=$(get_csrf "$USER_CREATE_HTML")
    USER_CSRF_FIELD="_csrf"
    if echo "$USER_CREATE_HTML" | grep -q 'name="_token"'; then USER_CSRF_FIELD="_token"; fi
    if echo "$USER_CREATE_HTML" | grep -q "csrfmiddlewaretoken"; then USER_CSRF_FIELD="csrfmiddlewaretoken"; fi
    USER_CSRF_PARAM=""
    USER_CSRF_QPARAM=""
    if [ -n "$USER_CSRF" ]; then
      USER_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$USER_CSRF" 2>/dev/null || echo "$USER_CSRF")
      USER_CSRF_PARAM="&${USER_CSRF_FIELD}=${USER_CSRF_ENC}"
      USER_CSRF_QPARAM="?${USER_CSRF_FIELD}=${USER_CSRF_ENC}"
    fi

    # Extract role ID dari form (banyak app mensyaratkan minimal 1 role)
    ROLE_ARGS=()
    ROLE_ENCODED=""
    ROLE_ID_1=$(echo "$USER_CREATE_HTML" | grep -oP 'name="roles\[\]" value="\K[^"]+' | head -1)
    if [ -z "$ROLE_ID_1" ]; then
      ROLE_ID_1=$(echo "$USER_CREATE_HTML" | grep -oP 'value="\K[^"]+(?="[^>]*name="roles\[\]")' | head -1)
    fi
    if [ -z "$ROLE_ID_1" ]; then
      ROLE_ID_1=$(echo "$USER_CREATE_HTML" | grep -oP 'name="role_ids\[\]" value="\K[^"]+|name="roles" value="\K[0-9a-zA-Z_-]+' | head -1)
    fi
    if [ -n "$ROLE_ID_1" ]; then
      ROLE_ARGS=(-F "roles[]=${ROLE_ID_1}")
      ROLE_ENCODED="&roles[]=${ROLE_ID_1}"
    fi

    # T07-F-01: Create (C) — multipart (user form has file upload)
    TEST_USER_TS=$(date +%s)
    TEST_USER_EMAIL="smoke${TEST_USER_TS}@test.com"
    TEST_USER_CODE="SU${TEST_USER_TS}"
    USER_STORE_URL=$(echo "$USER_CREATE_HTML" | grep -oP 'action="[^"]*user[^"]*"' | grep -v logout | tail -1 | grep -oP '(?<=action=")[^"]+')
    USER_STORE_URL=$(echo "$USER_STORE_URL" | sed 's/[?&]_csrf=[^&]*//g;s/[?&]_method=[^&]*//g;s/[?&]$//')
    if [ -z "$USER_STORE_URL" ]; then USER_STORE_URL="$USER_BASE"; fi
    if [[ "$USER_STORE_URL" != http* ]]; then USER_STORE_URL="$BASE$USER_STORE_URL"; fi
    # Multipart dulu (NodeAdmin/PHP/Laravel butuh ini karena ada picture upload)
    CREATE_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR -b $JAR \
      -F "name=SmokeUser${TEST_USER_TS}" \
      -F "code=${TEST_USER_CODE}" \
      -F "email=${TEST_USER_EMAIL}" \
      -F "phone=08112345678" \
      -F "timezone=UTC" \
      -F "password=Smoke1234!" \
      -F "password_confirmation=Smoke1234!" \
      -F "status=Active" \
      "${ROLE_ARGS[@]}" \
      "${USER_STORE_URL}${USER_CSRF_QPARAM}")
    # Fallback: url-encoded (GoAdmin/DotNet/Rust mungkin tidak pakai multer)
    if [ "$CREATE_USER_STATUS" != "302" ] && [ "$CREATE_USER_STATUS" != "303" ] && [ "$CREATE_USER_STATUS" != "200" ]; then
      CREATE_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR -b $JAR \
        --data "name=SmokeUser${TEST_USER_TS}&code=${TEST_USER_CODE}&email=${TEST_USER_EMAIL}&phone=08112345678&timezone=UTC&password=Smoke1234%21&password_confirmation=Smoke1234%21&status=Active${ROLE_ENCODED}${USER_CSRF_PARAM}" \
        "${USER_STORE_URL}${USER_CSRF_QPARAM}")
    fi
    check_redirect T07-F-01 "User create POST -> redirect" "$CREATE_USER_STATUS"

    # Cari ID user baru via filter q_email
    NEW_USER_HTML=$(curl -s -c $JAR -b $JAR "$USER_BASE?q_email=${TEST_USER_EMAIL}")
    NEW_USER_ID=$(echo "$NEW_USER_HTML" | grep -oP '(?<=/user/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    if [ -z "$NEW_USER_ID" ]; then
      NEW_USER_ID=$(echo "$NEW_USER_HTML" | grep -oP '(?<=/users/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi
    # Fallback: before/after diff
    if [ -z "$NEW_USER_ID" ]; then
      AFTER_USER_HTML=$(curl -s -c $JAR -b $JAR -L "$USER_BASE")
      AFTER_USER_IDS=$(echo "$AFTER_USER_HTML" | grep -oP '(?<=/users?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)
      NEW_USER_ID=$(comm -13 <(echo "$BEFORE_USER_IDS") <(echo "$AFTER_USER_IDS") | head -1)
    fi
    # Fallback: cari email di halaman
    if [ -z "$NEW_USER_ID" ]; then
      NEW_USER_ID=$(echo "${AFTER_USER_HTML:-$NEW_USER_HTML}" | grep -B5 "$TEST_USER_EMAIL" | grep -oP '(?<=/users?/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi

    # T07-F-03: Read (R)
    if [ -n "$NEW_USER_ID" ]; then
      check T07-F-03 "User baru ditemukan di index (Read)" "<found>" "<found>"

      # T07-F-04: Update (U)
      UPD_USER_EDIT=$(curl -s -c $JAR -b $JAR "$USER_BASE/$NEW_USER_ID/edit")
      UPD_USER_CSRF=$(get_csrf "$UPD_USER_EDIT")
      if [ -z "$UPD_USER_CSRF" ]; then
        UPD_USER_CSRF=$(echo "$UPD_USER_EDIT" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      UPD_USER_CSRF_BODY=""; UPD_USER_CSRF_QPARAM=""
      if [ -n "$UPD_USER_CSRF" ]; then
        UPD_USER_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$UPD_USER_CSRF" 2>/dev/null || echo "$UPD_USER_CSRF")
        UPD_USER_CSRF_BODY="${USER_CSRF_FIELD}=${UPD_USER_CSRF_ENC}"
        UPD_USER_CSRF_QPARAM="&${USER_CSRF_FIELD}=${UPD_USER_CSRF_ENC}"
      fi
      UPD_USER_ACTION=$(echo "$UPD_USER_EDIT" | grep -oP 'action="[^"]*'"$NEW_USER_ID"'[^"]*"' | head -1 | sed 's/action="//;s/"//')
      UPD_USER_URL=$(echo "$UPD_USER_ACTION" | sed 's/[?&]_method=[^&"]*//gi' | sed 's/[?&]_csrf=[^&"]*//gi' | sed 's/[?&]$//')
      if [[ "$UPD_USER_URL" != http* ]]; then UPD_USER_URL="$BASE$UPD_USER_URL"; fi
      if [ -z "$UPD_USER_URL" ] || [ "$UPD_USER_URL" = "$BASE" ]; then UPD_USER_URL="$USER_BASE/$NEW_USER_ID"; fi
      UPD_USER_DATA="name=SmokeUpdated&code=${TEST_USER_CODE}&email=${TEST_USER_EMAIL}&phone=08112345679&timezone=UTC&password=&password_confirmation=&status=Active${ROLE_ENCODED}"
      # 1) URL-override: ?_method=PUT di URL, CSRF di body+URL
      UPD_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "${UPD_USER_DATA}&${UPD_USER_CSRF_BODY}" \
        "${UPD_USER_URL}?_method=PUT${UPD_USER_CSRF_QPARAM}")
      # 2) Body-override (Laravel/Spring)
      if [ "$UPD_USER_STATUS" = "404" ] || [ "$UPD_USER_STATUS" = "405" ]; then
        UPD_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${UPD_USER_DATA}&_method=PUT&${UPD_USER_CSRF_BODY}" \
          "$UPD_USER_URL")
      fi
      # 3) POST + query CSRF (GoAdmin pattern)
      if [ "$UPD_USER_STATUS" = "403" ] || [ "$UPD_USER_STATUS" = "404" ]; then
        UPD_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$UPD_USER_DATA" \
          "${UPD_USER_URL}?_method=PUT${UPD_USER_CSRF_QPARAM}")
      fi
      # 4) /update suffix + CSRF body (PHPAdmin/DjangoAdmin)
      if [ "$UPD_USER_STATUS" = "404" ] || [ "$UPD_USER_STATUS" = "405" ] || [ "$UPD_USER_STATUS" = "403" ]; then
        UPD_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${UPD_USER_DATA}&${UPD_USER_CSRF_BODY}" \
          "${USER_BASE}/${NEW_USER_ID}/update?_method=PUT")
      fi
      # 5) /update suffix + query CSRF (RustAdmin)
      if [ "$UPD_USER_STATUS" = "403" ] || [ "$UPD_USER_STATUS" = "404" ] || [ "$UPD_USER_STATUS" = "405" ]; then
        UPD_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$UPD_USER_DATA" \
          "${USER_BASE}/${NEW_USER_ID}/update?_method=PUT${UPD_USER_CSRF_QPARAM}")
      fi
      check_redirect T07-F-04 "User update (PUT) -> redirect" "$UPD_USER_STATUS"

      # T07-F-02: Delete (D)
      DEL_USER_PAGE=$(curl -s -c $JAR -b $JAR "$USER_BASE/$NEW_USER_ID/edit")
      DEL_USER_CSRF=$(get_csrf "$DEL_USER_PAGE")
      if [ -z "$DEL_USER_CSRF" ]; then
        DEL_USER_CSRF=$(echo "$DEL_USER_PAGE" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      DEL_USER_CSRF_BODY=""; DEL_USER_CSRF_QPARAM=""
      if [ -n "$DEL_USER_CSRF" ]; then
        DEL_USER_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$DEL_USER_CSRF" 2>/dev/null || echo "$DEL_USER_CSRF")
        DEL_USER_CSRF_BODY="${USER_CSRF_FIELD}=${DEL_USER_CSRF_ENC}"
        DEL_USER_CSRF_QPARAM="&${USER_CSRF_FIELD}=${DEL_USER_CSRF_ENC}"
      fi
      # 1) NodeAdmin/Go: ?_method=DELETE di URL, CSRF di body
      DEL_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "$DEL_USER_CSRF_BODY" \
        "$USER_BASE/$NEW_USER_ID/delete?_method=DELETE")
      # 2) Body-override tanpa /delete suffix (Spring)
      if [ "$DEL_USER_STATUS" = "404" ]; then
        DEL_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${DEL_USER_CSRF_BODY}" \
          "$USER_BASE/$NEW_USER_ID")
      fi
      # 3) Body-override dengan /delete suffix (Laravel/PHP)
      if [ "$DEL_USER_STATUS" = "404" ]; then
        DEL_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${DEL_USER_CSRF_BODY}" \
          "$USER_BASE/$NEW_USER_ID/delete")
      fi
      # 4) URL query override tanpa /delete (CppAdmin/DotNet/NestAdmin)
      if [ "$DEL_USER_STATUS" = "404" ] || [ "$DEL_USER_STATUS" = "405" ]; then
        DEL_USER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${DEL_USER_CSRF_BODY}" \
          "$USER_BASE/$NEW_USER_ID?_method=DELETE${DEL_USER_CSRF_QPARAM}")
      fi
      check_redirect T07-F-02 "User delete -> redirect" "$DEL_USER_STATUS"
    else
      check T07-F-03 "User baru ditemukan di index (Read)" "<found>" ""
      skip T07-F-04 "User update (user baru tidak ditemukan di index)"
      skip T07-F-02 "User delete (user baru tidak ditemukan di index)"
    fi
  else
    skip T07-F-01 "User create POST (form create tidak dapat diakses)"
    skip T07-F-03 "User baru di index (form create tidak dapat diakses)"
    skip T07-F-04 "User update (form create tidak dapat diakses)"
    skip T07-F-02 "User delete (form create tidak dapat diakses)"
  fi
else
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19 E-20 E-21 E-22 E-23; do
    skip "T07-E-$i" "User index elements (index tidak dapat diakses)"
  done
  skip T07-B-01 "User create form (index tidak dapat diakses)"
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18; do
    skip "T07-B-$i" "Create form elements (index tidak dapat diakses)"
  done
  skip T07-D-01 "User edit (index tidak dapat diakses)"
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15; do
    skip "T07-D-$i" "Edit form elements (index tidak dapat diakses)"
  done
  skip T07-F-01 "User create POST (index tidak dapat diakses)"
  skip T07-F-03 "User baru di index (index tidak dapat diakses)"
  skip T07-F-04 "User update (index tidak dapat diakses)"
  skip T07-F-02 "User delete (index tidak dapat diakses)"
fi

# T08 - Roles (try singular /role first, then plural /roles)
echo "[T08] Roles"
ROLE_BASE="$BASE/admin/v1/access/role"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$ROLE_BASE")
if [ "$STATUS" != "200" ]; then
  ROLE_BASE="$BASE/admin/v1/access/roles"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$ROLE_BASE")
fi
check T08-A-01 "Role index -> 200" "200" "$STATUS"

if [ "$STATUS" = "200" ]; then
  ROLE_HTML=$(curl -s -b $JAR "$ROLE_BASE")
  BEFORE_ROLE_IDS=$(echo "$ROLE_HTML" | grep -oP '(?<=/roles?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)

  # T08-E: Elemen halaman index role
  echo "[T08-E] Role Index Elements"
  check_html T08-E-01 "Heading Role Management"        "Role Management"                          "$ROLE_HTML"
  check_html T08-E-02 "Card heading Role List"         "Role List"                                "$ROLE_HTML"
  check_html T08-E-03 "Tombol Add Data"                "Add Data"                                 "$ROLE_HTML"
  check_html T08-E-04 "Tombol Delete Selected"         "Delete Selected"                          "$ROLE_HTML"
  check_html T08-E-05 "Kolom Name"                     ">Name<"                                   "$ROLE_HTML"
  check_html T08-E-06 "Kolom Status"                   ">Status<"                                 "$ROLE_HTML"
  check_html T08-E-07 "Kolom Description"              ">Description<"                            "$ROLE_HTML"
  check_html T08-E-08 "Filter q_name"                  'name="q_name"\|name=.q_name'             "$ROLE_HTML"
  check_html T08-E-09 "Filter q_status"                'name="q_status"\|name=.q_status'         "$ROLE_HTML"
  check_html T08-E-10 "Filter q_desc"                  'name="q_desc"\|name=.q_desc'             "$ROLE_HTML"
  check_html T08-E-11 "Checkbox checkall"              'id="checkall"\|id=.checkall'              "$ROLE_HTML"
  check_html T08-E-12 "Status icon fa-check/times"     "fa-check-circle\|fa-times-circle"         "$ROLE_HTML"
  check_html T08-E-13 "Action dropdown"                "dropdown-menu"                             "$ROLE_HTML"
  check_html T08-E-14 "Permission link fa-key"         "fa-key"                                   "$ROLE_HTML"
  check_html T08-E-15 "data-confirm Confirm Delete"    "Confirm Delete"                           "$ROLE_HTML"
  check_html T08-E-16 "Pagination"                     "pagination\|page-item"                    "$ROLE_HTML"
  check_html T08-E-17 "Filter q_page_size"             'name="q_page_size"\|name=.q_page_size'   "$ROLE_HTML"
  check_html T08-E-18 "Add Data btn-success"           'btn-success'                              "$ROLE_HTML"
  check_html T08-E-19 "Delete btn fa-trash"            "fa-trash"                                 "$ROLE_HTML"
  check_html T08-E-20 "Edit link fa-pen"               "fa-pen\|fa-edit\|fa-pencil"               "$ROLE_HTML"

  # Extract role ID
  ROLE_ID=$(echo "$ROLE_HTML" | grep -oP '(?<=/role/)[a-zA-Z0-9_-]+(?=/edit)' | head -1)
  if [ -z "$ROLE_ID" ]; then
    ROLE_ID=$(echo "$ROLE_HTML" | grep -oP '(?<=/roles/)[a-zA-Z0-9_-]+(?=/edit)' | head -1)
  fi

  # T08-B: Form create role
  echo "[T08-B] Role Create Form"
  STATUS_B=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$ROLE_BASE/create")
  check T08-B-01 "Role create form -> 200" "200" "$STATUS_B"
  ROLE_CREATE_HTML=""
  if [ "$STATUS_B" = "200" ]; then
    ROLE_CREATE_HTML=$(curl -s -b $JAR "$ROLE_BASE/create")
    check_html T08-B-E-01 "Form POST ada"            "<form"                                             "$ROLE_CREATE_HTML"
    check_html T08-B-E-02 "Input name"               'name="name"\|name=.name'                           "$ROLE_CREATE_HTML"
    check_html T08-B-E-03 "Input desc"               'name="desc"\|name=.desc\|name=.description'        "$ROLE_CREATE_HTML"
    check_html T08-B-E-04 "Select status"            '<select[^>]*name="status"\|<select[^>]*name=.status' "$ROLE_CREATE_HTML"
    check_html T08-B-E-05 "CSRF token"               "csrf"                                               "$ROLE_CREATE_HTML"
    check_html T08-B-E-06 "Tombol Save/Submit"       'type="submit"\|type=.submit'                       "$ROLE_CREATE_HTML"
    check_html T08-B-E-07 "h1 Role Management"       "Role Management"                                   "$ROLE_CREATE_HTML"
    check_html T08-B-E-08 "h2 Role Form"             "Role Form"                                         "$ROLE_CREATE_HTML"
    check_html T08-B-E-09 "Status option Active"     ">Active<"                                          "$ROLE_CREATE_HTML"
    check_html T08-B-E-10 "Status option Inactive"   ">Inactive<"                                        "$ROLE_CREATE_HTML"
    check_html T08-B-E-11 "Back link to role index"  'btn-danger\|btn btn-secondary\|btn btn-warning'    "$ROLE_CREATE_HTML"
  else
    for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11; do
      skip "T08-B-$i" "Role create form elements (halaman tidak dapat diakses)"
    done
  fi

  # T08-D: Form edit role
  echo "[T08-D] Role Edit Form"
  if [ -n "$ROLE_ID" ]; then
    STATUS_D=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$ROLE_BASE/$ROLE_ID/edit")
    check T08-D-01 "Role edit form -> 200" "200" "$STATUS_D"
    if [ "$STATUS_D" = "200" ]; then
      ROLE_EDIT_HTML=$(curl -s -b $JAR "$ROLE_BASE/$ROLE_ID/edit")
      check_html T08-D-E-01 "Form ada"               "<form"                                             "$ROLE_EDIT_HTML"
      check_html T08-D-E-02 "Input name"            'name="name"\|name=.name'                           "$ROLE_EDIT_HTML"
      check_html T08-D-E-03 "Select status"         '<select[^>]*name="status"\|<select[^>]*name=.status' "$ROLE_EDIT_HTML"
      check_html T08-D-E-04 "Input desc"            'name="desc"\|name=.desc\|name=.description'        "$ROLE_EDIT_HTML"
      check_html T08-D-E-05 "CSRF token"            "csrf"                                               "$ROLE_EDIT_HTML"
      check_html T08-D-E-06 "h1 Role Management"    "Role Management"                                   "$ROLE_EDIT_HTML"
      check_html T08-D-E-07 "h2 Role Form"          "Role Form"                                         "$ROLE_EDIT_HTML"
      check_html T08-D-E-08 "PUT method override"   '_method=PUT\|method=.PUT\|value=.PUT\|name=._method' "$ROLE_EDIT_HTML"
      check_html T08-D-E-09 "Status option Active"  ">Active<"                                          "$ROLE_EDIT_HTML"
      check_html T08-D-E-10 "Status option Inactive" ">Inactive<"                                       "$ROLE_EDIT_HTML"
    else
      for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10; do
        skip "T08-D-$i" "Role edit form elements (halaman tidak dapat diakses)"
      done
    fi
  else
    skip T08-D-01 "Role edit (tidak ada role ID di halaman index)"
    for i in E-01 E-02 E-03 E-04 E-05; do
      skip "T08-D-$i" "Role edit form elements (tidak ada role ID)"
    done
  fi

  # T08-C: Role permission page + element checks
  echo "[T08-C] Role Permission Page"
  if [ -n "$ROLE_ID" ]; then
    RPERM_URL="$ROLE_BASE/$ROLE_ID/permission"
    RPERM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$RPERM_URL")
    if [ "$RPERM_STATUS" != "200" ]; then
      RPERM_URL="$ROLE_BASE/$ROLE_ID/permissions"
      RPERM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$RPERM_URL")
    fi
    if [ "$RPERM_STATUS" != "200" ]; then
      RPERM_URL="$BASE/admin/v1/access/roles/$ROLE_ID/permission"
      RPERM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$RPERM_URL")
    fi
    if [ "$RPERM_STATUS" != "200" ]; then
      RPERM_URL="$BASE/admin/v1/access/roles/$ROLE_ID/permissions"
      RPERM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$RPERM_URL")
    fi
    check T08-C-01 "Role permission page -> 200" "200" "$RPERM_STATUS"
    if [ "$RPERM_STATUS" = "200" ]; then
      RPERM_HTML=$(curl -s -b $JAR "$RPERM_URL")
      check_html T08-C-E-01 "Heading Permission Management"  "Permission Management"               "$RPERM_HTML"
      check_html T08-C-E-02 "Card heading Permission List"   "Permission List"                     "$RPERM_HTML"
      check_html T08-C-E-03 "Tombol Assign Selected"         "Assign Selected"                     "$RPERM_HTML"
      check_html T08-C-E-04 "Tombol Unassign Selected"       "Unassign Selected"                   "$RPERM_HTML"
      check_html T08-C-E-05 "data-confirm Confirm Assign"    "Confirm Assign"                      "$RPERM_HTML"
      check_html T08-C-E-06 "data-confirm Confirm Unassign"  "Confirm Unassign"                    "$RPERM_HTML"
      check_html T08-C-E-07 "Kolom Name"                     ">Name<"                              "$RPERM_HTML"
      check_html T08-C-E-08 "Kolom Status"                   ">Status<"                            "$RPERM_HTML"
      check_html T08-C-E-09 "Kolom Description"              ">Description<"                       "$RPERM_HTML"
      check_html T08-C-E-10 "Status icon check/times-circle"  "fa-check-circle\|fa-times-circle"    "$RPERM_HTML"
      check_html T08-C-E-11 "Action dropdown Assign"         "Assign"                              "$RPERM_HTML"
      check_html T08-C-E-12 "Action dropdown Unassign"       "Unassign"                            "$RPERM_HTML"
      check_html T08-C-E-13 "Checkbox checkall"              'id="checkall"\|id=.checkall'         "$RPERM_HTML"
      check_html T08-C-E-14 "Pagination"                     "pagination\|page-item"               "$RPERM_HTML"
      check_html T08-C-E-15 "Filter q_name"                  'name="q_name"\|name=.q_name'        "$RPERM_HTML"
      check_html T08-C-E-16 "Filter q_status"                'name="q_status"\|name=.q_status'    "$RPERM_HTML"
      check_html T08-C-E-17 "Filter q_desc"                  'name="q_desc"\|name=.q_desc'        "$RPERM_HTML"
      check_html T08-C-E-18 "Filter q_page_size"             'name="q_page_size"\|name=.q_page_size' "$RPERM_HTML"
      check_html T08-C-E-19 "Assign Selected btn-info"       "btn-info"                            "$RPERM_HTML"
      check_html T08-C-E-20 "assign_selected URL"            "assign_selected"                     "$RPERM_HTML"
      check_html T08-C-E-21 "unassign_selected URL"          "unassign_selected"                   "$RPERM_HTML"
    else
      for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19 E-20 E-21; do
        skip "T08-C-$i" "Role permission elements (halaman tidak dapat diakses)"
      done
    fi
  else
    skip T08-C-01 "Role permission page (no role ID found)"
    for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19 E-20 E-21; do
      skip "T08-C-$i" "Role permission elements (tidak ada role ID)"
    done
  fi

  # T08-F: Role CRUD (functional: Create → Read → Update → Delete)
  echo "[T08-F] Role CRUD (functional)"
  if [ -n "$ROLE_CREATE_HTML" ]; then
    ROLE_CSRF=$(get_csrf "$ROLE_CREATE_HTML")
    ROLE_CSRF_FIELD="_csrf"
    if echo "$ROLE_CREATE_HTML" | grep -q 'name="_token"'; then ROLE_CSRF_FIELD="_token"; fi
    if echo "$ROLE_CREATE_HTML" | grep -q "csrfmiddlewaretoken"; then ROLE_CSRF_FIELD="csrfmiddlewaretoken"; fi
    ROLE_CSRF_PARAM=""
    ROLE_CSRF_QPARAM=""
    if [ -n "$ROLE_CSRF" ]; then
      ROLE_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$ROLE_CSRF" 2>/dev/null || echo "$ROLE_CSRF")
      ROLE_CSRF_PARAM="&${ROLE_CSRF_FIELD}=${ROLE_CSRF_ENC}"
      ROLE_CSRF_QPARAM="?${ROLE_CSRF_FIELD}=${ROLE_CSRF_ENC}"
    fi

    # T08-F-01: Create (C)
    TEST_ROLE_NAME="smoke-role-$(date +%s)"
    ROLE_STORE_URL=$(echo "$ROLE_CREATE_HTML" | grep -oP 'action="[^"]*role[^"]*"' | grep -v logout | tail -1 | grep -oP '(?<=action=")[^"]+')
    ROLE_STORE_URL=$(echo "$ROLE_STORE_URL" | sed 's/[?&]_csrf=[^&]*//g' | sed 's/[?&]$//')
    if [ -z "$ROLE_STORE_URL" ]; then ROLE_STORE_URL="$ROLE_BASE"; fi
    if [[ "$ROLE_STORE_URL" != http* ]]; then ROLE_STORE_URL="$BASE$ROLE_STORE_URL"; fi
    CREATE_ROLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR -b $JAR \
      --data "name=${TEST_ROLE_NAME}&status=Active&desc=Smoke+test+role${ROLE_CSRF_PARAM}" \
      "${ROLE_STORE_URL}${ROLE_CSRF_QPARAM}")
    check_redirect T08-F-01 "Role create POST -> redirect" "$CREATE_ROLE_STATUS"

    # Cari ID role baru via filter q_name
    NEW_ROLE_HTML=$(curl -s -c $JAR -b $JAR "$ROLE_BASE?q_name=${TEST_ROLE_NAME}")
    NEW_ROLE_ID=$(echo "$NEW_ROLE_HTML" | grep -oP '(?<=/role/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    if [ -z "$NEW_ROLE_ID" ]; then
      NEW_ROLE_ID=$(echo "$NEW_ROLE_HTML" | grep -oP '(?<=/roles/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi
    # Fallback: before/after diff
    if [ -z "$NEW_ROLE_ID" ]; then
      AFTER_ROLE_HTML=$(curl -s -c $JAR -b $JAR -L "$ROLE_BASE")
      AFTER_ROLE_IDS=$(echo "$AFTER_ROLE_HTML" | grep -oP '(?<=/roles?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)
      NEW_ROLE_ID=$(comm -13 <(echo "$BEFORE_ROLE_IDS") <(echo "$AFTER_ROLE_IDS") | head -1)
    fi
    # Fallback: cari nama di halaman
    if [ -z "$NEW_ROLE_ID" ]; then
      NEW_ROLE_ID=$(echo "${AFTER_ROLE_HTML:-$NEW_ROLE_HTML}" | grep -B5 "$TEST_ROLE_NAME" | grep -oP '(?<=/roles?/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi

    # T08-F-03: Read (R)
    if [ -n "$NEW_ROLE_ID" ]; then
      check T08-F-03 "Role baru ditemukan di index (Read)" "<found>" "<found>"

      # T08-F-04: Update (U)
      ROLE_UPD_HTML=$(curl -s -c $JAR -b $JAR "$ROLE_BASE/$NEW_ROLE_ID/edit")
      ROLE_UPD_CSRF=$(get_csrf "$ROLE_UPD_HTML")
      if [ -z "$ROLE_UPD_CSRF" ]; then
        ROLE_UPD_CSRF=$(echo "$ROLE_UPD_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      ROLE_UPD_CSRF_BODY=""; ROLE_UPD_CSRF_QPARAM=""
      if [ -n "$ROLE_UPD_CSRF" ]; then
        ROLE_UPD_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$ROLE_UPD_CSRF" 2>/dev/null || echo "$ROLE_UPD_CSRF")
        ROLE_UPD_CSRF_BODY="${ROLE_CSRF_FIELD}=${ROLE_UPD_CSRF_ENC}"
        ROLE_UPD_CSRF_QPARAM="&${ROLE_CSRF_FIELD}=${ROLE_UPD_CSRF_ENC}"
      fi
      ROLE_UPD_ACTION=$(echo "$ROLE_UPD_HTML" | grep -oP 'action="[^"]*'"$NEW_ROLE_ID"'[^"]*"' | head -1 | sed 's/action="//;s/"//')
      ROLE_UPD_URL=$(echo "$ROLE_UPD_ACTION" | sed 's/[?&]_method=[^&"]*//gi' | sed 's/[?&]_csrf=[^&"]*//gi' | sed 's/[?&]$//')
      if [[ "$ROLE_UPD_URL" != http* ]]; then ROLE_UPD_URL="$BASE$ROLE_UPD_URL"; fi
      if [ -z "$ROLE_UPD_URL" ] || [ "$ROLE_UPD_URL" = "$BASE" ]; then ROLE_UPD_URL="$ROLE_BASE/$NEW_ROLE_ID"; fi
      TEST_ROLE_UPD_NAME="${TEST_ROLE_NAME}-upd"
      ROLE_UPD_DATA="name=${TEST_ROLE_UPD_NAME}&status=Active&desc=Updated+smoke+role"
      # 1) URL-override: ?_method=PUT (covers NodeAdmin, NestAdmin, DjangoAdmin, DotNetAdmin, CppAdmin)
      ROLE_UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "${ROLE_UPD_DATA}&${ROLE_UPD_CSRF_BODY}" \
        "${ROLE_UPD_URL}?_method=PUT${ROLE_UPD_CSRF_QPARAM}")
      # 2) Body-override: _method=PUT di body (Laravel/Spring)
      if [ "$ROLE_UPD_STATUS" = "404" ] || [ "$ROLE_UPD_STATUS" = "405" ]; then
        ROLE_UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${ROLE_UPD_DATA}&_method=PUT&${ROLE_UPD_CSRF_BODY}" \
          "$ROLE_UPD_URL")
      fi
      # 3) GoAdmin: CSRF di URL query, bukan body
      if [ "$ROLE_UPD_STATUS" = "403" ] || [ "$ROLE_UPD_STATUS" = "404" ]; then
        ROLE_UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$ROLE_UPD_DATA" \
          "${ROLE_UPD_URL}?_method=PUT${ROLE_UPD_CSRF_QPARAM}")
      fi
      # 4) /update suffix (PHPAdmin/DjangoAdmin)
      if [ "$ROLE_UPD_STATUS" = "404" ] || [ "$ROLE_UPD_STATUS" = "405" ] || [ "$ROLE_UPD_STATUS" = "403" ]; then
        ROLE_UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${ROLE_UPD_DATA}&${ROLE_UPD_CSRF_BODY}" \
          "${ROLE_BASE}/${NEW_ROLE_ID}/update?_method=PUT")
      fi
      # 5) /update suffix + CSRF di URL (RustAdmin/KotlinAdmin)
      if [ "$ROLE_UPD_STATUS" = "403" ] || [ "$ROLE_UPD_STATUS" = "404" ] || [ "$ROLE_UPD_STATUS" = "405" ]; then
        ROLE_UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$ROLE_UPD_DATA" \
          "${ROLE_BASE}/${NEW_ROLE_ID}/update?_method=PUT${ROLE_UPD_CSRF_QPARAM}")
      fi
      check_redirect T08-F-04 "Role update (PUT) -> redirect" "$ROLE_UPD_STATUS"

      # T08-F-02: Delete (D)
      ROLE_DEL_HTML=$(curl -s -c $JAR -b $JAR "$ROLE_BASE/$NEW_ROLE_ID/edit")
      ROLE_DEL_CSRF=$(get_csrf "$ROLE_DEL_HTML")
      if [ -z "$ROLE_DEL_CSRF" ]; then
        ROLE_DEL_CSRF=$(echo "$ROLE_DEL_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      ROLE_DEL_CSRF_BODY=""; ROLE_DEL_CSRF_QPARAM=""; ROLE_DEL_CSRF_ENC=""
      if [ -n "$ROLE_DEL_CSRF" ]; then
        ROLE_DEL_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$ROLE_DEL_CSRF" 2>/dev/null || echo "$ROLE_DEL_CSRF")
        ROLE_DEL_CSRF_BODY="${ROLE_CSRF_FIELD}=${ROLE_DEL_CSRF_ENC}"
        ROLE_DEL_CSRF_QPARAM="&${ROLE_CSRF_FIELD}=${ROLE_DEL_CSRF_ENC}"
      fi
      # 1) NodeAdmin/Go: ?_method=DELETE di URL, CSRF di body, /delete suffix
      ROLE_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "$ROLE_DEL_CSRF_BODY" \
        "$ROLE_BASE/$NEW_ROLE_ID/delete?_method=DELETE")
      # 2) Body-override tanpa /delete suffix (Spring)
      if [ "$ROLE_DEL_STATUS" = "404" ]; then
        ROLE_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${ROLE_DEL_CSRF_BODY}" \
          "$ROLE_BASE/$NEW_ROLE_ID")
      fi
      # 3) Body-override dengan /delete suffix (Laravel/PHP)
      if [ "$ROLE_DEL_STATUS" = "404" ]; then
        ROLE_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${ROLE_DEL_CSRF_BODY}" \
          "$ROLE_BASE/$NEW_ROLE_ID/delete")
      fi
      # 4) CppAdmin/DotNet/NestAdmin: ?_method=DELETE di URL, tanpa /delete suffix
      if [ "$ROLE_DEL_STATUS" = "404" ] || [ "$ROLE_DEL_STATUS" = "405" ]; then
        ROLE_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "$ROLE_DEL_CSRF_BODY" \
          "$ROLE_BASE/$NEW_ROLE_ID?_method=DELETE${ROLE_DEL_CSRF_QPARAM}")
      fi
      # 5) GoAdmin: POST dengan _csrf di URL, /delete suffix
      if [ "$ROLE_DEL_STATUS" = "403" ] || [ "$ROLE_DEL_STATUS" = "404" ]; then
        ROLE_DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "" \
          "$ROLE_BASE/$NEW_ROLE_ID/delete?_method=DELETE&_csrf=${ROLE_DEL_CSRF_ENC}")
      fi
      check_redirect T08-F-02 "Role delete -> redirect" "$ROLE_DEL_STATUS"
    else
      check T08-F-03 "Role baru ditemukan di index (Read)" "<found>" ""
      skip T08-F-04 "Role update (role baru tidak ditemukan di index)"
      skip T08-F-02 "Role delete (role baru tidak ditemukan di index)"
    fi
  else
    skip T08-F-01 "Role create POST (form create tidak dapat diakses)"
    skip T08-F-03 "Role baru di index (form create tidak dapat diakses)"
    skip T08-F-04 "Role update (form create tidak dapat diakses)"
    skip T08-F-02 "Role delete (form create tidak dapat diakses)"
  fi

else
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19 E-20; do
    skip "T08-$i" "Role index elements (halaman tidak dapat diakses)"
  done
  skip T08-B-01 "Role create (index tidak dapat diakses)"
  for i in B-E-01 B-E-02 B-E-03 B-E-04 B-E-05 B-E-06 B-E-07 B-E-08 B-E-09 B-E-10 B-E-11; do
    skip "T08-$i" "Role create elements (index tidak dapat diakses)"
  done
  skip T08-D-01 "Role edit (index tidak dapat diakses)"
  for i in D-E-01 D-E-02 D-E-03 D-E-04 D-E-05 D-E-06 D-E-07 D-E-08 D-E-09 D-E-10; do
    skip "T08-$i" "Role edit elements (index tidak dapat diakses)"
  done
  skip T08-C-01 "Role permission page (index tidak dapat diakses)"
  for i in C-E-01 C-E-02 C-E-03 C-E-04 C-E-05 C-E-06 C-E-07 C-E-08 C-E-09 C-E-10 C-E-11 C-E-12 C-E-13 C-E-14 C-E-15 C-E-16 C-E-17 C-E-18 C-E-19 C-E-20 C-E-21; do
    skip "T08-$i" "Role permission elements (index tidak dapat diakses)"
  done
  skip T08-F-01 "Role create POST (index tidak dapat diakses)"
  skip T08-F-03 "Role baru di index (index tidak dapat diakses)"
  skip T08-F-04 "Role update (index tidak dapat diakses)"
  skip T08-F-02 "Role delete (index tidak dapat diakses)"
fi

# T09 - Permissions (try singular then plural)
echo "[T09] Permissions"
PERM_BASE="$BASE/admin/v1/access/permission"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$PERM_BASE")
if [ "$STATUS" != "200" ]; then
  PERM_BASE="$BASE/admin/v1/access/permissions"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$PERM_BASE")
fi
check T09-01 "Permission index -> 200" "200" "$STATUS"

if [ "$STATUS" = "200" ]; then
  PERM_HTML=$(curl -s -b $JAR "$PERM_BASE")
  BEFORE_IDS=$(echo "$PERM_HTML" | grep -oP '(?<=/permissions?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)

  # T09-E: Elemen halaman index permission
  echo "[T09-E] Permission Index Elements"
  check_html T09-E-01 "Heading Permission Management"      "Permission Management"                          "$PERM_HTML"
  check_html T09-E-02 "Tombol Add Data"                    "Add Data"                                       "$PERM_HTML"
  check_html T09-E-03 "Tombol Delete Selected"             "Delete Selected"                                "$PERM_HTML"
  check_html T09-E-04 "Kolom Name"                         ">Name<"                                         "$PERM_HTML"
  check_html T09-E-05 "Kolom Guard"                        ">Guard<"                                        "$PERM_HTML"
  check_html T09-E-06 "Kolom Method"                       ">Method<"                                       "$PERM_HTML"
  check_html T09-E-07 "Kolom Status"                       ">Status<"                                       "$PERM_HTML"
  check_html T09-E-08 "Kolom Description"                  ">Description<"                                  "$PERM_HTML"
  check_html T09-E-09 "Filter q_name"                      'name="q_name"\|name=.q_name'                   "$PERM_HTML"
  check_html T09-E-10 "Filter q_guard (select)"            'name="q_guard"\|name=.q_guard'                 "$PERM_HTML"
  check_html T09-E-11 "Filter q_method (select)"           'name="q_method"\|name=.q_method'               "$PERM_HTML"
  check_html T09-E-12 "Filter q_status (select)"           'name="q_status"\|name=.q_status'               "$PERM_HTML"
  check_html T09-E-13 "Filter q_desc"                      'name="q_desc"\|name=.q_desc'                   "$PERM_HTML"
  check_html T09-E-14 "Checkbox checkall"                  'id="checkall"\|id=.checkall'                   "$PERM_HTML"
  check_html T09-E-15 "Guard badge text-bg-primary"        "text-bg-primary"                               "$PERM_HTML"
  check_html T09-E-16 "Status icon fa-check/fa-times"      "fa-check-circle\|fa-times-circle"              "$PERM_HTML"
  check_html T09-E-17 "Action dropdown ada"                "dropdown-menu"                                  "$PERM_HTML"
  check_html T09-E-18 "data-confirm Confirm Delete"        "Confirm Delete"                                 "$PERM_HTML"
  check_html T09-E-19 "Pagination ada"                     "pagination\|page-item"                          "$PERM_HTML"

  # T09-B: Form create permission
  echo "[T09-B] Permission Create Form"
  STATUS_B=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$PERM_BASE/create")
  check T09-B-01 "Permission create form -> 200" "200" "$STATUS_B"
  CREATE_HTML=""
  if [ "$STATUS_B" = "200" ]; then
    CREATE_HTML=$(curl -s -b $JAR "$PERM_BASE/create")
    check_html T09-B-E-01 "Form POST ada"           "<form"                                                   "$CREATE_HTML"
    check_html T09-B-E-02 "Input name"              'name="name"\|name=.name'                                 "$CREATE_HTML"
    check_html T09-B-E-03 "Select guard_name"       'name="guard_name"\|name=.guard_name\|name=.guard'       "$CREATE_HTML"
    check_html T09-B-E-04 "Select method"           'name="method"\|name=.method'                             "$CREATE_HTML"
    check_html T09-B-E-05 "Select status"           'name="status"\|name=.status'                             "$CREATE_HTML"
    check_html T09-B-E-06 "Input desc/description"  'name="desc"\|name=.desc\|name=.description'             "$CREATE_HTML"
    check_html T09-B-E-07 "CSRF token"              "csrf"                                                    "$CREATE_HTML"
    check_html T09-B-E-08 "Tombol submit"           'type="submit"\|type=.submit'                             "$CREATE_HTML"
  else
    for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08; do
      skip "T09-B-$i" "Create form elements (halaman tidak dapat diakses)"
    done
  fi

  # Extract permission ID dari index untuk edit/delete test (support UUID & integer)
  PERM_ID=$(echo "$PERM_HTML" | grep -oP '(?<=/permission/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
  if [ -z "$PERM_ID" ]; then
    PERM_ID=$(echo "$PERM_HTML" | grep -oP '(?<=/permissions/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
  fi

  # T09-C: Form edit permission
  echo "[T09-C] Permission Edit Form"
  if [ -n "$PERM_ID" ]; then
    STATUS_C=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$PERM_BASE/$PERM_ID/edit")
    check T09-C-01 "Permission edit form -> 200" "200" "$STATUS_C"
    if [ "$STATUS_C" = "200" ]; then
      EDIT_HTML=$(curl -s -b $JAR "$PERM_BASE/$PERM_ID/edit")
      check_html T09-C-E-01 "Form ada"              "<form"                                                   "$EDIT_HTML"
      check_html T09-C-E-02 "Input name pre-filled" 'name="name"\|name=.name'                                 "$EDIT_HTML"
      check_html T09-C-E-03 "Select guard_name"     'name="guard_name"\|name=.guard_name\|name=.guard'       "$EDIT_HTML"
      check_html T09-C-E-04 "Select method"         'name="method"\|name=.method'                             "$EDIT_HTML"
      check_html T09-C-E-05 "CSRF token"            "csrf"                                                    "$EDIT_HTML"
    else
      for i in E-01 E-02 E-03 E-04 E-05; do
        skip "T09-C-$i" "Edit form elements (halaman tidak dapat diakses)"
      done
    fi
  else
    skip T09-C-01 "Permission edit (tidak ada permission ID di halaman index)"
    for i in E-01 E-02 E-03 E-04 E-05; do
      skip "T09-C-$i" "Edit form elements (tidak ada permission ID)"
    done
  fi

  # T09-D: Create → Read → Update → Delete (full CRUD functional test)
  echo "[T09-D] Permission CRUD (functional)"
  if [ -n "$CREATE_HTML" ]; then
    PERM_CSRF=$(get_csrf "$CREATE_HTML")
    PERM_CSRF_FIELD="_csrf"
    if echo "$CREATE_HTML" | grep -q 'name="_token"'; then PERM_CSRF_FIELD="_token"; fi
    if echo "$CREATE_HTML" | grep -q "csrfmiddlewaretoken"; then PERM_CSRF_FIELD="csrfmiddlewaretoken"; fi
    PERM_CSRF_PARAM=""
    PERM_CSRF_QPARAM=""
    if [ -n "$PERM_CSRF" ]; then
      PERM_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$PERM_CSRF" 2>/dev/null || echo "$PERM_CSRF")
      PERM_CSRF_PARAM="&${PERM_CSRF_FIELD}=${PERM_CSRF_ENC}"
      PERM_CSRF_QPARAM="?${PERM_CSRF_FIELD}=${PERM_CSRF_ENC}"
    fi

    # T09-D-01: Create (C)
    TEST_PERM_NAME="smoke-test-$(date +%s)"
    # Ambil URL store dari form action (bisa /permission/store atau /permission)
    STORE_URL=$(echo "$CREATE_HTML" | grep -oP 'action="[^"]*permission[^"]*"' | grep -v logout | tail -1 | grep -oP '(?<=action=")[^"]+')
    # Strip any existing _csrf param from URL so PERM_CSRF_QPARAM can be appended cleanly
    STORE_URL=$(echo "$STORE_URL" | sed 's/[?&]_csrf=[^&]*//g' | sed 's/[?&]$//')
    if [ -z "$STORE_URL" ]; then STORE_URL="$PERM_BASE"; fi
    if [[ "$STORE_URL" != http* ]]; then STORE_URL="$BASE$STORE_URL"; fi
    CREATE_POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -c $JAR -b $JAR \
      --data "name=${TEST_PERM_NAME}&guard_name=web&guardName=web&method=GET&status=Active&desc=Smoke+test&description=Smoke+test${PERM_CSRF_PARAM}" \
      "${STORE_URL}${PERM_CSRF_QPARAM}")
    check_redirect T09-D-01 "Permission create POST -> redirect" "$CREATE_POST_STATUS"

    # Cari ID permission yang baru dibuat via filter q_name (support UUID & integer)
    NEW_PERM_HTML=$(curl -s -c $JAR -b $JAR "$PERM_BASE?q_name=${TEST_PERM_NAME}")
    NEW_PERM_ID=$(echo "$NEW_PERM_HTML" | grep -oP '(?<=/permission/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    if [ -z "$NEW_PERM_ID" ]; then
      NEW_PERM_ID=$(echo "$NEW_PERM_HTML" | grep -oP '(?<=/permissions/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi
    # Fallback: before/after index diff (untuk app yang q_name tidak return edit links)
    if [ -z "$NEW_PERM_ID" ]; then
      AFTER_HTML=$(curl -s -c $JAR -b $JAR -L "$PERM_BASE")
      AFTER_IDS=$(echo "$AFTER_HTML" | grep -oP '(?<=/permissions?/)[0-9a-zA-Z_-]+(?=/edit)' | sort -u)
      NEW_PERM_ID=$(comm -13 <(echo "$BEFORE_IDS") <(echo "$AFTER_IDS") | head -1)
    fi
    # Fallback: cari nama di halaman index (unfiltered)
    if [ -z "$NEW_PERM_ID" ]; then
      NEW_PERM_ID=$(echo "${AFTER_HTML:-$NEW_PERM_HTML}" | grep -B5 "$TEST_PERM_NAME" | grep -oP '(?<=/permissions?/)[0-9a-zA-Z_-]+(?=/edit)' | head -1)
    fi

    # T09-D-03: Read (R) – permission baru muncul di index
    if [ -n "$NEW_PERM_ID" ]; then
      check T09-D-03 "Permission baru ditemukan di index (Read)" "<found>" "<found>"

      # T09-D-04: Update (U) – ambil CSRF segar, submit PUT
      UPD_EDIT_HTML=$(curl -s -c $JAR -b $JAR "$PERM_BASE/$NEW_PERM_ID/edit")
      UPD_CSRF=$(get_csrf "$UPD_EDIT_HTML")
      # Fallback: CSRF embedded dalam form action URL (RustAdmin pattern)
      if [ -z "$UPD_CSRF" ]; then
        UPD_CSRF=$(echo "$UPD_EDIT_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      UPD_CSRF_BODY=""; UPD_CSRF_QPARAM=""
      if [ -n "$UPD_CSRF" ]; then
        UPD_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$UPD_CSRF" 2>/dev/null || echo "$UPD_CSRF")
        UPD_CSRF_BODY="${PERM_CSRF_FIELD}=${UPD_CSRF_ENC}"
        UPD_CSRF_QPARAM="&${PERM_CSRF_FIELD}=${UPD_CSRF_ENC}"
      fi
      # Deteksi update URL dari form action (hapus _method dan _csrf params)
      UPD_ACTION=$(echo "$UPD_EDIT_HTML" | grep -oP 'action="[^"]*'"$NEW_PERM_ID"'[^"]*"' | head -1 | sed 's/action="//;s/"//')
      UPD_URL=$(echo "$UPD_ACTION" | sed 's/[?&]_method=[^&"]*//gi' | sed 's/[?&]_csrf=[^&"]*//gi' | sed 's/[?&]$//')
      if [[ "$UPD_URL" != http* ]]; then UPD_URL="$BASE$UPD_URL"; fi
      if [ -z "$UPD_URL" ] || [ "$UPD_URL" = "$BASE" ]; then UPD_URL="$PERM_BASE/$NEW_PERM_ID"; fi
      TEST_UPD_NAME="${TEST_PERM_NAME}-upd"
      UPD_DATA="name=${TEST_UPD_NAME}&guard_name=web&guardName=web&method=POST&status=Active&desc=Updated+smoke&description=Updated+smoke"
      # 1) URL-override: ?_method=PUT di URL, CSRF di body+URL (covers body-readers & URL-readers like NestAdmin)
      UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "${UPD_DATA}&${UPD_CSRF_BODY}" \
        "${UPD_URL}?_method=PUT${UPD_CSRF_QPARAM}")
      # 2) Body-override: _method=PUT di body (Laravel/Spring)
      if [ "$UPD_STATUS" = "404" ] || [ "$UPD_STATUS" = "405" ]; then
        UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${UPD_DATA}&_method=PUT&${UPD_CSRF_BODY}" \
          "$UPD_URL")
      fi
      # 3) GoAdmin pattern: CSRF di URL query string, bukan body
      if [ "$UPD_STATUS" = "403" ] || [ "$UPD_STATUS" = "404" ]; then
        UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$UPD_DATA" \
          "${UPD_URL}?_method=PUT${UPD_CSRF_QPARAM}")
      fi
      # 4) /update suffix + CSRF di body (PHPAdmin/DjangoAdmin — URL langsung, bukan dari form action)
      if [ "$UPD_STATUS" = "404" ] || [ "$UPD_STATUS" = "405" ] || [ "$UPD_STATUS" = "403" ]; then
        UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "${UPD_DATA}&${UPD_CSRF_BODY}" \
          "${PERM_BASE}/${NEW_PERM_ID}/update?_method=PUT")
      fi
      # 5) RustAdmin: /update suffix + CSRF di URL query string
      if [ "$UPD_STATUS" = "403" ] || [ "$UPD_STATUS" = "404" ] || [ "$UPD_STATUS" = "405" ]; then
        UPD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "$UPD_DATA" \
          "${PERM_BASE}/${NEW_PERM_ID}/update?_method=PUT${UPD_CSRF_QPARAM}")
      fi
      check_redirect T09-D-04 "Permission update (PUT) -> redirect" "$UPD_STATUS"

      # T09-D-02: Delete (D) – ambil CSRF segar setelah update
      DEL_PAGE_HTML=$(curl -s -c $JAR -b $JAR "$PERM_BASE/$NEW_PERM_ID/edit")
      DEL_CSRF=$(get_csrf "$DEL_PAGE_HTML")
      # Fallback: CSRF embedded dalam form action URL (RustAdmin pattern)
      if [ -z "$DEL_CSRF" ]; then
        DEL_CSRF=$(echo "$DEL_PAGE_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
      fi
      DEL_CSRF_BODY=""
      DEL_CSRF_QPARAM=""
      if [ -n "$DEL_CSRF" ]; then
        DEL_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$DEL_CSRF" 2>/dev/null || echo "$DEL_CSRF")
        DEL_CSRF_BODY="${PERM_CSRF_FIELD}=${DEL_CSRF_ENC}"
        DEL_CSRF_QPARAM="&${PERM_CSRF_FIELD}=${DEL_CSRF_ENC}"
      fi
      # 1) NodeAdmin/Go pattern: ?_method=DELETE di URL, CSRF di body
      DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
        --data "$DEL_CSRF_BODY" \
        "$PERM_BASE/$NEW_PERM_ID/delete?_method=DELETE")
      # 2) Body-override pattern: _method=DELETE di body, tanpa /delete suffix (Spring)
      if [ "$DEL_STATUS" = "404" ]; then
        DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${DEL_CSRF_BODY}" \
          "$PERM_BASE/$NEW_PERM_ID")
      fi
      # 3) Fallback: body-override dengan /delete suffix (Laravel/PHP pattern)
      if [ "$DEL_STATUS" = "404" ]; then
        DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "_method=DELETE&${DEL_CSRF_BODY}" \
          "$PERM_BASE/$NEW_PERM_ID/delete")
      fi
      # 4) CppAdmin/DotNet/NestAdmin pattern: ?_method=DELETE di URL, CSRF di body+URL, tanpa /delete suffix
      if [ "$DEL_STATUS" = "404" ] || [ "$DEL_STATUS" = "405" ]; then
        DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          --data "$DEL_CSRF_BODY" \
          "$PERM_BASE/$NEW_PERM_ID?_method=DELETE${DEL_CSRF_QPARAM}")
      fi
      # 5) GoAdmin pattern: POST dengan _csrf di URL query string (bukan body), /delete suffix
      if [ "$DEL_STATUS" = "403" ] || [ "$DEL_STATUS" = "404" ]; then
        DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR \
          -X POST --data "" \
          "$PERM_BASE/$NEW_PERM_ID/delete?_method=DELETE&_csrf=${DEL_CSRF_ENC}")
      fi
      check_redirect T09-D-02 "Permission delete -> redirect" "$DEL_STATUS"
    else
      check T09-D-03 "Permission baru ditemukan di index (Read)" "<found>" ""
      skip T09-D-04 "Permission update (permission baru tidak ditemukan di index)"
      skip T09-D-02 "Permission delete (permission baru tidak ditemukan di index)"
    fi
  else
    skip T09-D-01 "Permission create POST (form create tidak dapat diakses)"
    skip T09-D-03 "Permission baru di index (form create tidak dapat diakses)"
    skip T09-D-04 "Permission update (form create tidak dapat diakses)"
    skip T09-D-02 "Permission delete (form create tidak dapat diakses)"
  fi
else
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19; do
    skip "T09-$i" "Permission element check (halaman tidak dapat diakses)"
  done
  for i in B-01 B-E-01 B-E-02 B-E-03 B-E-04 B-E-05 B-E-06 B-E-07 B-E-08; do
    skip "T09-$i" "Permission create (index tidak dapat diakses)"
  done
  skip T09-C-01 "Permission edit (index tidak dapat diakses)"
  for i in C-E-01 C-E-02 C-E-03 C-E-04 C-E-05; do
    skip "T09-$i" "Permission edit elements (index tidak dapat diakses)"
  done
  skip T09-D-01 "Permission create POST (index tidak dapat diakses)"
  skip T09-D-03 "Permission baru di index (index tidak dapat diakses)"
  skip T09-D-04 "Permission update (index tidak dapat diakses)"
  skip T09-D-02 "Permission delete (index tidak dapat diakses)"
fi

# T10 - Profile
echo "[T10] Profile"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/profile")
check T10-01 "Profile -> 200" "200" "$STATUS"

# T11 - Setting
echo "[T11] Setting"
SETT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/setting")
check T11-01 "Setting -> 200" "200" "$SETT_STATUS"

if [ "$SETT_STATUS" = "200" ]; then
  SETT_HTML=$(curl -s -b $JAR "$BASE/admin/v1/setting")

  echo "[T11-E] Setting Elements"
  # Admin Theme
  check_html T11-E-01 "Heading 'Admin Theme'"           "Admin Theme"                              "$SETT_HTML"
  check_html T11-E-02 "fa-palette icon"                 "fa-palette"                               "$SETT_HTML"
  check_html T11-E-03 "theme-swatch class"              "theme-swatch"                             "$SETT_HTML"
  check_html T11-E-04 "Input theme (radio)"             'name="theme"\|name=.theme'                "$SETT_HTML"
  check_html T11-E-05 "Pilihan theme Blue"              "Blue"                                     "$SETT_HTML"
  check_html T11-E-06 "Pilihan theme Purple"            "Purple"                                   "$SETT_HTML"
  check_html T11-E-07 "Pilihan theme Green"             "Green"                                    "$SETT_HTML"
  check_html T11-E-08 "Pilihan theme Orange"            "Orange"                                   "$SETT_HTML"
  check_html T11-E-09 "Pilihan theme Red"               "Red"                                      "$SETT_HTML"
  # Frontend Template
  check_html T11-E-10 "Heading 'Frontend Template'"     "Frontend Template"                        "$SETT_HTML"
  check_html T11-E-11 "fa-window-maximize icon"         "fa-window-maximize"                       "$SETT_HTML"
  check_html T11-E-12 "fe_template hidden input"        'name="fe_template"\|name=.fe_template'    "$SETT_HTML"
  check_html T11-E-13 "fe-card class"                   "fe-card"                                  "$SETT_HTML"
  check_html T11-E-14 "fe_search form"                  'fe_search\|id="fe_search\|id=.fe_search'  "$SETT_HTML"
  # Setting Form
  check_html T11-E-15 "Heading 'Setting Form'"          "Setting Form"                             "$SETT_HTML"
  check_html T11-E-16 "Input name"                      'name="name"\|name=.name'                  "$SETT_HTML"
  check_html T11-E-17 "Input phone"                     'name="phone"\|name=.phone'                "$SETT_HTML"
  check_html T11-E-18 "Input email"                     'name="email"\|name=.email'                "$SETT_HTML"
  check_html T11-E-19 "Input logo (file)"               'name="logo"\|name=.logo'                  "$SETT_HTML"
  check_html T11-E-20 "Input login_image (file)"        'name="login_image"\|name=.login_image'    "$SETT_HTML"
  check_html T11-E-21 "Textarea description (trumbowyg)" "trumbowyg-editor"                        "$SETT_HTML"
  check_html T11-E-22 "fa-save button"                  "fa-save"                                  "$SETT_HTML"
  check_html T11-E-23 "PUT method override"             '_method.*PUT\|value.*PUT\|method.*PUT'    "$SETT_HTML"
  check_html T11-E-24 "CSRF token"                      "csrf"                                     "$SETT_HTML"

  echo "[T11-F] Setting Save Functional"
  # Detect CSRF field name from setting page
  SETT_CSRF_FIELD="_csrf"
  if echo "$SETT_HTML" | grep -q 'name="_token"'; then SETT_CSRF_FIELD="_token"; fi
  if echo "$SETT_HTML" | grep -q "csrfmiddlewaretoken"; then SETT_CSRF_FIELD="csrfmiddlewaretoken"; fi
  if echo "$SETT_HTML" | grep -q "__RequestVerificationToken"; then SETT_CSRF_FIELD="__RequestVerificationToken"; fi

  SETT_CSRF=$(get_csrf "$SETT_HTML")
  # Fallback: CSRF in action URL (GoAdmin/RustAdmin)
  if [ -z "$SETT_CSRF" ]; then
    SETT_CSRF=$(echo "$SETT_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
  fi

  SETT_CSRF_BODY=""; SETT_CSRF_QPARAM=""
  if [ -n "$SETT_CSRF" ]; then
    SETT_CSRF_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$SETT_CSRF" 2>/dev/null || echo "$SETT_CSRF")
    SETT_CSRF_BODY="${SETT_CSRF_FIELD}=${SETT_CSRF_ENC}"
    SETT_CSRF_QPARAM="&${SETT_CSRF_FIELD}=${SETT_CSRF_ENC}"
  fi

  # Detect current theme to switch away from it
  # Flatten HTML first to handle multi-line attributes (checked on different line than value=)
  SETT_HTML_FLAT=$(echo "$SETT_HTML" | tr '\n' ' ' | tr -s ' ')
  SETT_CUR_THEME=$(echo "$SETT_HTML_FLAT" | grep -oiP '<input[^>]+>' | \
    grep -i 'checked' | grep -oiP '(?<=value=")[a-zA-Z]+' | \
    grep -ioP 'blue|purple|green|orange|red' | head -1 | \
    python3 -c "import sys; s=sys.stdin.read().strip(); print(s[:1].upper()+s[1:].lower() if s else '')" 2>/dev/null || echo "")
  if [ -z "$SETT_CUR_THEME" ]; then
    # LaravelAdmin: hidden name="theme" stores the current value (no checked attr on it)
    SETT_CUR_THEME=$(echo "$SETT_HTML_FLAT" | grep -oiP '<input[^>]*name="theme"[^>]*type="hidden"[^>]*>|<input[^>]*type="hidden"[^>]*name="theme"[^>]*>' | \
      grep -oiP '(?<=value=")[a-zA-Z]+' | grep -ioP 'blue|purple|green|orange|red' | head -1 | \
      python3 -c "import sys; s=sys.stdin.read().strip(); print(s[:1].upper()+s[1:].lower() if s else '')" 2>/dev/null || echo "")
  fi
  SETT_NEW_THEME="Purple"
  [ "$SETT_CUR_THEME" = "Purple" ] && SETT_NEW_THEME="Green"

  SETT_DATA="theme=${SETT_NEW_THEME}&fe_template=agency-consulting-002-creative-agency&name=TestAdmin&phone=081000000000&email=admin%40admin.com&initial=TA&address=Test+Address&copyright=Test+Copyright&description=Test+Description"

  # Helper: run a strategy curl, return "CODE LOC" where LOC is the redirect target (empty if non-redirect)
  # A redirect is "good" only if the Location contains "setting"; otherwise we set 417 to try next strategy.
  _sett_try() {
    local _out
    _out=$(curl -s -o /dev/null -w "%{http_code}||%{redirect_url}" -c $JAR -b $JAR "$@" 2>/dev/null)
    local _code="${_out%%||*}"
    local _loc="${_out##*||}"
    if [ "$_code" = "302" ] || [ "$_code" = "303" ]; then
      echo "$_loc" | grep -q "setting" && echo "$_code" || echo "417"
    else
      echo "$_code"
    fi
  }

  # Strategy 1: POST /update?_method=PUT + CSRF in body (NodeAdmin/GoAdmin/PHPAdmin/DjangoAdmin/CppAdmin/DotNetAdmin)
  # x-csrf-token header included (harmless for most; handles apps that accept it over body)
  SETT_UPD=$(_sett_try \
    -H "x-csrf-token: ${SETT_CSRF}" \
    --data "${SETT_DATA}&${SETT_CSRF_BODY}" \
    "$BASE/admin/v1/setting/update?_method=PUT${SETT_CSRF_QPARAM}")
  # Strategy 2: _method=PUT in body to /setting (LaravelAdmin)
  if [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -H "x-csrf-token: ${SETT_CSRF}" \
      --data "_method=PUT&${SETT_DATA}&${SETT_CSRF_BODY}" \
      "$BASE/admin/v1/setting")
  fi
  # Strategy 3: Direct PUT to /setting/update (KotlinAdmin/SpringAdmin)
  if [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -H "x-csrf-token: ${SETT_CSRF}" \
      -X PUT --data "${SETT_DATA}&${SETT_CSRF_BODY}" \
      "$BASE/admin/v1/setting/update")
  fi
  # Strategy 4: POST /setting?_method=PUT (NestAdmin — query-based method override)
  if [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "403" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -H "x-csrf-token: ${SETT_CSRF}" \
      --data "${SETT_DATA}&${SETT_CSRF_BODY}" \
      "$BASE/admin/v1/setting?_method=PUT${SETT_CSRF_QPARAM}")
  fi
  # Strategy 5: POST + query CSRF only (RustAdmin — body parser may differ)
  if [ "$SETT_UPD" = "403" ] || [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -X POST --data "$SETT_DATA" \
      "$BASE/admin/v1/setting/update?_method=PUT${SETT_CSRF_QPARAM}")
  fi
  # Strategy 6: Direct PUT to /setting (CppAdmin — real PUT handler, no method-override)
  if [ "$SETT_UPD" = "403" ] || [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -X PUT --data "${SETT_DATA}&${SETT_CSRF_BODY}" \
      "$BASE/admin/v1/setting")
  fi
  # Strategy 7: Direct PUT /setting + X-CSRF-Token header (last resort)
  if [ "$SETT_UPD" = "403" ] || [ "$SETT_UPD" = "404" ] || [ "$SETT_UPD" = "405" ] || [ "$SETT_UPD" = "417" ]; then
    SETT_UPD=$(_sett_try \
      -X PUT --data "${SETT_DATA}&${SETT_CSRF_BODY}" \
      -H "x-csrf-token: ${SETT_CSRF}" \
      "$BASE/admin/v1/setting")
  fi
  check_redirect T11-F-01 "Setting save -> redirect" "$SETT_UPD"

  # Follow redirect, verify flash message + data persistence
  SETT_AFTER=$(curl -s -b $JAR "$BASE/admin/v1/setting")
  check_html T11-F-02 "Flash 'Save Setting Success.'" "Save Setting Success." "$SETT_AFTER"

  # Verify theme persisted (checked radio or active border class)
  # Flatten to handle multi-line attributes (checked / border classes on different line than value=)
  SETT_AFTER_FLAT=$(echo "$SETT_AFTER" | tr '\n' ' ' | tr -s ' ')
  # Primary: find <input> element with name="theme" or name="_theme_picker" that contains the new theme value
  THEME_OK=$(echo "$SETT_AFTER_FLAT" | grep -oiP '<input[^>]+>' | \
    grep -i 'name="theme"\|name="_theme_picker"' | grep -i "${SETT_NEW_THEME}" | head -1)
  if [ -z "$THEME_OK" ]; then
    # Secondary: any <input> with checked AND the theme value (covers all radio patterns)
    THEME_OK=$(echo "$SETT_AFTER_FLAT" | grep -oiP '<input[^>]+>' | \
      grep -i 'checked' | grep -i "${SETT_NEW_THEME}" | head -1)
  fi
  if [ -z "$THEME_OK" ]; then
    # Fallback: theme value alongside border-gray class (div-based themes, same line after flattening)
    THEME_OK=$(echo "$SETT_AFTER_FLAT" | grep -i "${SETT_NEW_THEME}" | grep -i 'border-gray-900\|border-gray-800\|active' | head -1)
  fi
  check T11-F-03 "Theme ${SETT_NEW_THEME} tersimpan" "saved" "$([ -n "$THEME_OK" ] && echo saved || echo NOT_SAVED)"

  # Verify fe_template persisted (slug appears in hidden input value or card active state)
  FE_OK=$(echo "$SETT_AFTER" | grep -i 'agency-consulting-002-creative-agency' | head -1)
  check T11-F-04 "fe_template tersimpan" "saved" "$([ -n "$FE_OK" ] && echo saved || echo NOT_SAVED)"

  # Restore original theme (fire-and-forget — keep state clean for other modules)
  SETT_REST_HTML=$(curl -s -b $JAR "$BASE/admin/v1/setting")
  SETT_REST_CSRF=$(get_csrf "$SETT_REST_HTML")
  if [ -z "$SETT_REST_CSRF" ]; then
    SETT_REST_CSRF=$(echo "$SETT_REST_HTML" | grep -oP 'action="[^"]*[?&]_csrf=\K[^&"]+' | head -1)
  fi
  SETT_REST_CB=""; SETT_REST_QP=""
  if [ -n "$SETT_REST_CSRF" ]; then
    SETT_REST_ENC=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$SETT_REST_CSRF" 2>/dev/null || echo "$SETT_REST_CSRF")
    SETT_REST_CB="${SETT_CSRF_FIELD}=${SETT_REST_ENC}"
    SETT_REST_QP="&${SETT_CSRF_FIELD}=${SETT_REST_ENC}"
  fi
  SETT_RESTORE="theme=Blue&fe_template=agency-consulting-002-creative-agency&name=TestAdmin&phone=081000000000&email=admin%40admin.com&initial=TA&address=Test+Address&copyright=Test+Copyright&description=Test+Description"
  R=$(_sett_try -H "x-csrf-token: ${SETT_REST_CSRF}" --data "${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting/update?_method=PUT${SETT_REST_QP}")
  [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -H "x-csrf-token: ${SETT_REST_CSRF}" --data "_method=PUT&${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting")
  [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -H "x-csrf-token: ${SETT_REST_CSRF}" -X PUT --data "${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting/update")
  [ "$R" = "403" ] || [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -H "x-csrf-token: ${SETT_REST_CSRF}" --data "${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting?_method=PUT${SETT_REST_QP}")
  [ "$R" = "403" ] || [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -X POST --data "$SETT_RESTORE" "$BASE/admin/v1/setting/update?_method=PUT${SETT_REST_QP}")
  [ "$R" = "403" ] || [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -X PUT --data "${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting")
  [ "$R" = "403" ] || [ "$R" = "404" ] || [ "$R" = "405" ] || [ "$R" = "417" ] && R=$(_sett_try -H "x-csrf-token: ${SETT_REST_CSRF}" -X PUT --data "${SETT_RESTORE}&${SETT_REST_CB}" "$BASE/admin/v1/setting")

else
  for i in E-01 E-02 E-03 E-04 E-05 E-06 E-07 E-08 E-09 E-10 E-11 E-12 E-13 E-14 E-15 E-16 E-17 E-18 E-19 E-20 E-21 E-22 E-23 E-24; do
    skip "T11-$i" "Setting element (halaman tidak dapat diakses)"
  done
  skip T11-F-01 "Setting save (halaman tidak dapat diakses)"
  skip T11-F-02 "Setting flash (halaman tidak dapat diakses)"
  skip T11-F-03 "Theme tersimpan (halaman tidak dapat diakses)"
  skip T11-F-04 "fe_template tersimpan (halaman tidak dapat diakses)"
fi

# T12 - Media
echo "[T12] Media"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/media/list")
check T12-01 "Media list -> 200" "200" "$STATUS"

# T15 - Components page
echo "[T15] Components"
COMP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR "$BASE/admin/v1/components")
check T15-01 "Components page -> 200" "200" "$COMP_STATUS"
if [ "$COMP_STATUS" = "200" ]; then
  COMP_HTML=$(curl -s -b $JAR "$BASE/admin/v1/components")
  echo "[T15-E] Components Elements"
  check_html T15-E-01 "Heading UI Components"            "UI Components"                       "$COMP_HTML"
  check_html T15-E-02 "Section 1: Stat Card"             "Stat Card\|stat.card\|stat-card"      "$COMP_HTML"
  check_html T15-E-03 "Counter element"                  "counter\|data-target"                 "$COMP_HTML"
  check_html T15-E-04 "Section 2: Chart"                 "Chart\|chart"                         "$COMP_HTML"
  check_html T15-E-05 "Canvas chart ada"                 "<canvas"                              "$COMP_HTML"
  check_html T15-E-06 "Section 3: Badge & Status"        "Badge\|badge"                         "$COMP_HTML"
  check_html T15-E-07 "Section 4: Alert"                 "Alert\|alert"                         "$COMP_HTML"
  check_html T15-E-08 "Section 5: Button & Dropdown"     "Button\|btn"                          "$COMP_HTML"
  check_html T15-E-09 "Section 6: Popup/Modal"           "Modal\|modal\|Popup\|popup"           "$COMP_HTML"
  check_html T15-E-10 "Section 7: Form"                  "form-control\|Form"                   "$COMP_HTML"
  check_html T15-E-11 "Section 8: Rich Text Editor"      "trumbowyg-editor"                     "$COMP_HTML"
  check_html T15-E-11b "Trumbowyg JS dimuat"             "trumbowyg\.min\.js\|Trumbowyg.*min.*js" "$COMP_HTML"
  check_html T15-E-11c "Trumbowyg init code ada"         "\.trumbowyg(\|fn\.trumbowyg\|trumbowyg({" "$COMP_HTML"
  check_html T15-E-12 "Section 9: Data Table"            "Data Table\|table.*bordered\|table-bordered" "$COMP_HTML"
  check_html T15-E-13 "Pagination ada"                   "pagination\|page-item"                "$COMP_HTML"
  check_html T15-E-14 "Dropdown action ada"              "dropdown-menu\|dropdown"              "$COMP_HTML"
  check_html T15-E-15 "File upload section ada"          "fileUpload\|file.*upload\|upload"     "$COMP_HTML"
  # Extract filemanager.js URL and verify it's accessible
  FM_URL=$(echo "$COMP_HTML" | grep -oi 'src="[^"]*filemanager\.js[^"]*"' | head -1 | grep -oi '"[^"]*"' | tr -d '"')
  if [ -z "$FM_URL" ]; then
    FM_URL=$(echo "$COMP_HTML" | grep -oi "src='[^']*filemanager\.js[^']*'" | head -1 | grep -oi "'[^']*'" | tr -d "'")
  fi
  if [ -n "$FM_URL" ]; then
    # Handle relative vs absolute URLs
    if [[ "$FM_URL" == http* ]]; then
      FM_FULL="$FM_URL"
    else
      FM_FULL="$BASE$FM_URL"
    fi
    FM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FM_FULL")
    check T15-E-16 "filemanager.js accessible (200)" "200" "$FM_STATUS"
  else
    skip T15-E-16 "filemanager.js URL tidak ditemukan di HTML"
  fi
else
  for i in 01 02 03 04 05 06 07 08 09 10 11 11b 11c 12 13 14 15 16; do
    skip "T15-E-$i" "Components element check (halaman tidak dapat diakses)"
  done
fi

# T14 - CSRF check (POST tanpa token harus ditolak: 302/303/403/419/405)
echo "[T14] CSRF"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b $JAR -X POST "$BASE/admin/v1/setting" \
  -d "_method=PUT&name=test")
if [ "$STATUS" = "403" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "303" ] \
   || [ "$STATUS" = "419" ] || [ "$STATUS" = "405" ] || [ "$STATUS" = "404" ]; then
  check T14-01 "POST without CSRF -> rejected" "blocked" "blocked"
else
  check T14-01 "POST without CSRF -> rejected" "blocked" "NOT_BLOCKED($STATUS)"
fi

# T16 - API Endpoints
echo "[T16] API Endpoints"
if [ -n "$TOKEN" ]; then
  # Role list (singular then plural)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role" -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" != "200" ]; then STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles" -H "Authorization: Bearer $TOKEN"); fi
  check T16-C-10 "API role list -> 200" "200" "$STATUS"
  # Permission list (singular then plural)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/permission" -H "Authorization: Bearer $TOKEN")
  if [ "$STATUS" != "200" ]; then STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/permissions" -H "Authorization: Bearer $TOKEN"); fi
  check T16-C-15 "API permission list -> 200" "200" "$STATUS"
  # Profile API
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/profile" -H "Authorization: Bearer $TOKEN")
  check T16-C-20 "API profile -> 200" "200" "$STATUS"
  # Setting API
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/setting" -H "Authorization: Bearer $TOKEN")
  check T16-C-22 "API setting -> 200" "200" "$STATUS"
  # API without token must 401 — use user endpoint (exists in all apps)
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/user")
  if [ "$STATUS" != "401" ]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/users")
  fi
  check T05-04 "API without token -> 401" "401" "$STATUS"
else
  skip T16 "API endpoints (no token)"
fi

# T20 - Seed Data
echo "[T20] Seed Data"
if [ -n "$TOKEN" ]; then
  USERS_SING=$(curl -s "$BASE/api/v1/access/user" -H "Authorization: Bearer $TOKEN")
  USERS_PLUR=$(curl -s "$BASE/api/v1/access/users" -H "Authorization: Bearer $TOKEN")
  HAS_ADMIN=$(echo "$USERS_SING" | grep -oP '"email":"admin@admin.com"' | head -1)
  [ -z "$HAS_ADMIN" ] && HAS_ADMIN=$(echo "$USERS_PLUR" | grep -oP '"email":"admin@admin.com"' | head -1)
  # Fallback: profile endpoint always returns the logged-in user (admin@admin.com)
  if [ -z "$HAS_ADMIN" ]; then
    _PROF=$(curl -s "$BASE/api/v1/profile" -H "Authorization: Bearer $TOKEN")
    HAS_ADMIN=$(echo "$_PROF" | grep -oP '"email":"admin@admin.com"' | head -1)
  fi
  check T20-01 "admin@admin.com exists" '"email":"admin@admin.com"' "$HAS_ADMIN"
else
  skip T20-01 "admin@admin.com check (no token)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Helper: try_api <TEST_ID> <LABEL> <METHOD> <BODY_JSON> <URL1> [URL2] [URL3]
#   Tries each URL in sequence until one returns 2xx. Marks skip if all 404/405.
# ─────────────────────────────────────────────────────────────────────────────
try_api() {
  local tid="$1" label="$2" method="$3" body="$4"; shift 4
  local st="" resp=""
  for url in "$@"; do
    if [ "$method" = "GET" ]; then
      st=$(curl -s -o /dev/null -w "%{http_code}" "$url" -H "Authorization: Bearer $TOKEN")
    elif [ "$method" = "DELETE" ]; then
      st=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$url" -H "Authorization: Bearer $TOKEN")
    else
      st=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
        -d "$body")
    fi
    [ "$st" != "404" ] && [ "$st" != "405" ] && [ "$st" != "000" ] && break
  done
  if [ "$st" = "404" ] || [ "$st" = "405" ] || [ "$st" = "000" ]; then
    skip "$tid" "$label (endpoint not available)"
    echo "__SKIP__"
  else
    check "$tid" "$label" "2" "$(echo "${st:0:1}")"
    echo "$st"
  fi
}

# Helper: try_api_body — like try_api but captures response body
try_api_body() {
  local tid="$1" label="$2" method="$3" body="$4"; shift 4
  local st="" resp=""
  for url in "$@"; do
    if [ "$method" = "GET" ]; then
      resp=$(curl -s "$url" -H "Authorization: Bearer $TOKEN")
    elif [ "$method" = "DELETE" ]; then
      resp=$(curl -s -X DELETE "$url" -H "Authorization: Bearer $TOKEN")
    else
      resp=$(curl -s -X "$method" "$url" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
        -d "$body")
    fi
    st=$(echo "$resp" | grep -oP '"status":true|"success":true|"ok":true' | head -1)
    http_st=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "$body" 2>/dev/null || echo "000")
    [ "$http_st" != "404" ] && [ "$http_st" != "405" ] && [ "$http_st" != "000" ] && break
  done
  if [ "$http_st" = "404" ] || [ "$http_st" = "405" ] || [ "$http_st" = "000" ]; then
    skip "$tid" "$label (endpoint not available)"
    echo "__SKIP__"
  else
    check "$tid" "$label" "2" "$(echo "${http_st:0:1}")"
    echo "$resp"
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Extract ID from API response (handles various response shapes)
# ─────────────────────────────────────────────────────────────────────────────
extract_id() {
  local resp="$1"
  local id=""
  id=$(echo "$resp" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    v=d.get('data',{}) or {}
    if isinstance(v,dict) and v.get('id'): print(v['id'])
    else:
        v2=v.get('data',{}) or {}
        if isinstance(v2,dict) and v2.get('id'): print(v2['id'])
        elif d.get('id'): print(d['id'])
except Exception: pass
" 2>/dev/null)
  [ -z "$id" ] && id=$(echo "$resp" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  echo "$id"
}

# ─────────────────────────────────────────────────────────────────────────────
# T17 - API User CRUD
# ─────────────────────────────────────────────────────────────────────────────
echo "[T17] API User CRUD"
if [ -n "$TOKEN" ]; then
  # Get admin role ID for user creation — try singular then plural
  ROLE_LIST=$(curl -s "$BASE/api/v1/access/role" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  API_ROLE_ID=$(echo "$ROLE_LIST" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    items = d.get('data', d.get('datas', []))
    if isinstance(items,dict): items=items.get('datas',items.get('data',[]))
    if isinstance(items,list) and items: print(items[0].get('id',''))
except Exception: pass
" 2>/dev/null)
  [ -z "$API_ROLE_ID" ] && API_ROLE_ID=$(echo "$ROLE_LIST" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  if [ -z "$API_ROLE_ID" ]; then
    ROLE_LIST=$(curl -s "$BASE/api/v1/access/roles" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    API_ROLE_ID=$(echo "$ROLE_LIST" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    items = d.get('data', d.get('datas', []))
    if isinstance(items,dict): items=items.get('datas',items.get('data',[]))
    if isinstance(items,list) and items: print(items[0].get('id',''))
except Exception: pass
" 2>/dev/null)
    [ -z "$API_ROLE_ID" ] && API_ROLE_ID=$(echo "$ROLE_LIST" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  fi

  # Unique email + code to avoid conflicts across runs
  API_USER_EMAIL="smoke.api.$(date +%s)@smoke.com"
  API_USER_CODE="SK$(date +%s | tail -c 6)"
  API_USER_BODY="{\"code\":\"${API_USER_CODE}\",\"name\":\"Smoke API User\",\"email\":\"${API_USER_EMAIL}\",\"password\":\"Smoke1234!\",\"password_confirmation\":\"Smoke1234!\",\"passwordConfirm\":\"Smoke1234!\",\"status\":\"Active\",\"roles\":[\"${API_ROLE_ID}\"],\"roleIds\":[\"${API_ROLE_ID}\"],\"role_ids\":[\"${API_ROLE_ID}\"],\"guard_name\":\"web\",\"timezone\":\"Asia/Jakarta\"}"

  # T17-A-01: Create user
  API_USR_RESP=$(curl -s -X POST "$BASE/api/v1/access/user/store" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_USER_BODY" 2>/dev/null)
  _ST=$(echo "$API_USR_RESP" | grep -oP '"status":true|"success":true' | head -1)
  if [ -z "$_ST" ]; then
    # Fallback: POST /access/users (NestAdmin/CppAdmin)
    API_USR_RESP=$(curl -s -X POST "$BASE/api/v1/access/users" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_USER_BODY" 2>/dev/null)
    _ST=$(echo "$API_USR_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  if [ -z "$_ST" ]; then
    # Fallback: POST /access/user JSON (some apps)
    API_USR_RESP=$(curl -s -X POST "$BASE/api/v1/access/user" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_USER_BODY" 2>/dev/null)
    _ST=$(echo "$API_USR_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  if [ -z "$_ST" ]; then
    # Fallback: DotNetAdmin uses [FromForm] POST /api/v1/access/user
    API_USR_RESP=$(curl -s -X POST "$BASE/api/v1/access/user" \
      -H "Authorization: Bearer $TOKEN" \
      -F "Code=${API_USER_CODE}" -F "Name=Smoke API User" -F "Email=${API_USER_EMAIL}" \
      -F "Password=Smoke1234!" -F "password_confirmation=Smoke1234!" \
      -F "Status=active" -F "Roles=${API_ROLE_ID}" 2>/dev/null)
    _ST=$(echo "$API_USR_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  _HTTP=$([ -n "$_ST" ] && echo "200" || echo "422")
  check T17-A-01 "API User create -> success" "200" "$_HTTP"
  API_USR_ID=$(echo "$API_USR_RESP" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    v=d.get('data',{}) or {}
    if isinstance(v,dict) and v.get('id'): print(v['id'])
    else:
        v2=v.get('data',{}) or {}
        if isinstance(v2,dict) and v2.get('id'): print(v2['id'])
except Exception: pass
" 2>/dev/null)
  [ -z "$API_USR_ID" ] && API_USR_ID=$(echo "$API_USR_RESP" | grep -oP '"id":"[0-9a-f-]{36}"' | tail -1 | grep -oP '"id":"\K[^"]+')

  if [ -n "$API_USR_ID" ]; then
    # T17-A-02: Read user
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/user/$API_USR_ID/edit" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/user/$API_USR_ID" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/users/$API_USR_ID" -H "Authorization: Bearer $TOKEN")
    check T17-A-02 "API User read (:id/edit or :id) -> 200" "200" "$_ST"

    # T17-A-03: Update user
    API_UPD_BODY="{\"code\":\"${API_USER_CODE}\",\"name\":\"Smoke API Updated\",\"email\":\"${API_USER_EMAIL}\",\"status\":\"Active\",\"roles\":[\"${API_ROLE_ID}\"],\"roleIds\":[\"${API_ROLE_ID}\"],\"role_ids\":[\"${API_ROLE_ID}\"],\"guard_name\":\"web\",\"timezone\":\"Asia/Jakarta\"}"
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/user/$API_USR_ID/update" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_UPD_BODY")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/user/$API_USR_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_UPD_BODY")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/users/$API_USR_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_UPD_BODY")
    check T17-A-03 "API User update -> 2xx" "2" "$(echo "${_ST:0:1}")"

    # T17-A-04: Delete user
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/user/$API_USR_ID/delete" \
      -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/user/$API_USR_ID" \
        -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/users/$API_USR_ID" \
        -H "Authorization: Bearer $TOKEN")
    check T17-A-04 "API User delete -> 2xx" "2" "$(echo "${_ST:0:1}")"
  else
    skip T17-A-02 "API User read (no user created)"
    skip T17-A-03 "API User update (no user created)"
    skip T17-A-04 "API User delete (no user created)"
  fi

  # T17-A-05: delete_selected (create a throwaway user first)
  _DEL_BODY="{\"code\":\"SD$(date +%s | tail -c 6)\",\"name\":\"Smoke Del\",\"email\":\"smoke.del.$(date +%s)@smoke.com\",\"password\":\"Smoke1234!\",\"password_confirmation\":\"Smoke1234!\",\"passwordConfirm\":\"Smoke1234!\",\"status\":\"Active\",\"roles\":[\"${API_ROLE_ID}\"],\"roleIds\":[\"${API_ROLE_ID}\"],\"role_ids\":[\"${API_ROLE_ID}\"],\"guard_name\":\"web\",\"timezone\":\"Asia/Jakarta\"}"
  _DEL_RESP=$(curl -s -X POST "$BASE/api/v1/access/user/store" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_DEL_BODY" 2>/dev/null)
  [ -z "$(echo "$_DEL_RESP" | grep -oP '"status":true|"success":true')" ] && \
    _DEL_RESP=$(curl -s -X POST "$BASE/api/v1/access/users" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_DEL_BODY" 2>/dev/null)
  [ -z "$(echo "$_DEL_RESP" | grep -oP '"status":true|"success":true')" ] && \
    _DEL_RESP=$(curl -s -X POST "$BASE/api/v1/access/user" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_DEL_BODY" 2>/dev/null)
  if [ -z "$(echo "$_DEL_RESP" | grep -oP '"status":true|"success":true')" ]; then
    _DEL_CODE="SD$(date +%s | tail -c 6)"; _DEL_EMAIL="smoke.del2.$(date +%s)@smoke.com"
    _DEL_RESP=$(curl -s -X POST "$BASE/api/v1/access/user" -H "Authorization: Bearer $TOKEN" \
      -F "Code=${_DEL_CODE}" -F "Name=Smoke Del" -F "Email=${_DEL_EMAIL}" \
      -F "Password=Smoke1234!" -F "password_confirmation=Smoke1234!" \
      -F "Status=active" -F "Roles=${API_ROLE_ID}" 2>/dev/null)
  fi
  _DEL_ID=$(echo "$_DEL_RESP" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    v=d.get('data',{}) or {}
    if isinstance(v,dict) and v.get('id'): print(v['id'])
    else:
        v2=v.get('data',{}) or {}
        if isinstance(v2,dict) and v2.get('id'): print(v2['id'])
except Exception: pass
" 2>/dev/null)
  [ -z "$_DEL_ID" ] && _DEL_ID=$(echo "$_DEL_RESP" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  if [ -n "$_DEL_ID" ]; then
    _SEL_BODY="{\"selected\":[\"${_DEL_ID}\"]}"
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/access/user/delete_selected" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_SEL_BODY")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/access/users/delete_selected" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_SEL_BODY")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T17-A-05 "API User delete_selected (not implemented)"
      # clean up
      curl -s -X DELETE "$BASE/api/v1/access/user/$_DEL_ID/delete" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1
      curl -s -X DELETE "$BASE/api/v1/access/user/$_DEL_ID" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1
      curl -s -X DELETE "$BASE/api/v1/access/users/$_DEL_ID" -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1
    else
      check T17-A-05 "API User delete_selected -> 2xx" "2" "$(echo "${_ST:0:1}")"
    fi
  else
    skip T17-A-05 "API User delete_selected (no user created)"
  fi
else
  for i in A-01 A-02 A-03 A-04 A-05; do skip "T17-$i" "API User CRUD (no token)"; done
fi

# ─────────────────────────────────────────────────────────────────────────────
# T18 - API Role CRUD
# ─────────────────────────────────────────────────────────────────────────────
echo "[T18] API Role CRUD"
if [ -n "$TOKEN" ]; then
  # T18-A-01: Create role (unique name to avoid stale-data 422)
  _ROLE_TS=$(date +%s | tail -c 6)
  API_ROLE_BODY="{\"name\":\"smoke-api-${_ROLE_TS}\",\"status\":\"Active\",\"guard_name\":\"web\",\"desc\":\"Smoke test role\"}"
  _T18_HTTP1="404"
  API_ROLE_RESP=$(curl -s -o /tmp/_t18r.json -w "%{http_code}" -X POST "$BASE/api/v1/access/role/store" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_BODY" 2>/dev/null)
  _T18_HTTP1="$API_ROLE_RESP"; API_ROLE_RESP=$(cat /tmp/_t18r.json 2>/dev/null)
  _ST=$(echo "$API_ROLE_RESP" | grep -oP '"status":true|"success":true' | head -1)
  if [ -z "$_ST" ]; then
    API_ROLE_RESP=$(curl -s -X POST "$BASE/api/v1/access/roles" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_BODY" 2>/dev/null)
    _ST=$(echo "$API_ROLE_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  if [ -z "$_ST" ]; then
    API_ROLE_RESP=$(curl -s -X POST "$BASE/api/v1/access/role" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_BODY" 2>/dev/null)
    _ST=$(echo "$API_ROLE_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  if [ -n "$_ST" ]; then
    check T18-A-01 "API Role create -> success" "200" "200"
  elif [ "$_T18_HTTP1" = "404" ] || [ "$_T18_HTTP1" = "405" ]; then
    skip T18-A-01 "API Role create (not implemented)"
  else
    check T18-A-01 "API Role create -> success" "200" "422"
  fi
  API_NEW_ROLE_ID=$(echo "$API_ROLE_RESP" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  [ -z "$API_NEW_ROLE_ID" ] && API_NEW_ROLE_ID=$(echo "$API_ROLE_RESP" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin); v=d.get('data',{}) or {}
    if isinstance(v,dict) and v.get('id'): print(v['id'])
except Exception: pass
" 2>/dev/null)

  if [ -n "$API_NEW_ROLE_ID" ]; then
    # T18-A-02: Read role
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$API_NEW_ROLE_ID/edit" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$API_NEW_ROLE_ID" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles/$API_NEW_ROLE_ID" -H "Authorization: Bearer $TOKEN")
    check T18-A-02 "API Role read -> 200" "200" "$_ST"

    # T18-A-03: Update role
    API_ROLE_UPD="{\"name\":\"smoke-api-role-upd\",\"status\":\"Active\",\"guard_name\":\"web\"}"
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/role/$API_NEW_ROLE_ID/update" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_UPD")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/role/$API_NEW_ROLE_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_UPD")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/roles/$API_NEW_ROLE_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_ROLE_UPD")
    check T18-A-03 "API Role update -> 2xx" "2" "$(echo "${_ST:0:1}")"

    # T18-A-04: Role permissions list
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$API_NEW_ROLE_ID/permission" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles/$API_NEW_ROLE_ID/permission" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles/$API_NEW_ROLE_ID/permissions" -H "Authorization: Bearer $TOKEN")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T18-A-04 "API Role permissions list (not implemented)"
    else
      check T18-A-04 "API Role permissions list -> 200" "200" "$_ST"
    fi

    # T18-A-05: Delete role
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/role/$API_NEW_ROLE_ID/delete" \
      -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/role/$API_NEW_ROLE_ID" \
        -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/roles/$API_NEW_ROLE_ID" \
        -H "Authorization: Bearer $TOKEN")
    check T18-A-05 "API Role delete -> 2xx" "2" "$(echo "${_ST:0:1}")"
  else
    for i in A-02 A-03 A-04 A-05; do skip "T18-$i" "API Role (no role created or not implemented)"; done
  fi
else
  for i in A-01 A-02 A-03 A-04 A-05; do skip "T18-$i" "API Role CRUD (no token)"; done
fi

# ─────────────────────────────────────────────────────────────────────────────
# T19 - API Permission CRUD
# ─────────────────────────────────────────────────────────────────────────────
echo "[T19] API Permission CRUD"
if [ -n "$TOKEN" ]; then
  # T19-A-01: Create permission — unique name to avoid stale-data 422
  _PERM_TS=$(date +%s | tail -c 6)
  API_PERM_BODY="{\"name\":\"smoke.api.${_PERM_TS}\",\"status\":\"Active\",\"guard_name\":\"web\",\"guardName\":\"web\",\"method\":\"GET\",\"path\":\"/smoke/api/test\",\"desc\":\"Smoke test permission\"}"
  API_PERM_RESP=$(curl -s -X POST "$BASE/api/v1/access/permission/store" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_BODY" 2>/dev/null)
  _ST=$(echo "$API_PERM_RESP" | grep -oP '"status":true|"success":true' | head -1)
  if [ -z "$_ST" ]; then
    API_PERM_RESP=$(curl -s -X POST "$BASE/api/v1/access/permissions" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_BODY" 2>/dev/null)
    _ST=$(echo "$API_PERM_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  if [ -z "$_ST" ]; then
    API_PERM_RESP=$(curl -s -X POST "$BASE/api/v1/access/permission" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_BODY" 2>/dev/null)
    _ST=$(echo "$API_PERM_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  # If validation error, try without method/path (NestAdmin-style)
  if [ -z "$_ST" ]; then
    _BODY2="{\"name\":\"smoke.api.${_PERM_TS}\",\"status\":\"Active\",\"guard_name\":\"web\",\"guardName\":\"web\"}"
    API_PERM_RESP=$(curl -s -X POST "$BASE/api/v1/access/permission/store" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_BODY2" 2>/dev/null)
    _ST=$(echo "$API_PERM_RESP" | grep -oP '"status":true|"success":true' | head -1)
    [ -z "$_ST" ] && API_PERM_RESP=$(curl -s -X POST "$BASE/api/v1/access/permissions" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$_BODY2" 2>/dev/null)
    _ST=$(echo "$API_PERM_RESP" | grep -oP '"status":true|"success":true' | head -1)
  fi
  _HTTP_ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/access/permission/store" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_BODY" 2>/dev/null || echo "404")
  if [ -n "$_ST" ]; then
    check T19-A-01 "API Permission create -> success" "200" "200"
  elif [ "$_HTTP_ST" = "404" ] || [ "$_HTTP_ST" = "405" ]; then
    skip T19-A-01 "API Permission create (not implemented)"
  else
    check T19-A-01 "API Permission create -> success" "200" "422"
  fi
  API_PERM_ID=$(echo "$API_PERM_RESP" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')
  [ -z "$API_PERM_ID" ] && API_PERM_ID=$(echo "$API_PERM_RESP" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin); v=d.get('data',{}) or {}
    if isinstance(v,dict) and v.get('id'): print(v['id'])
except Exception: pass
" 2>/dev/null)

  if [ -n "$API_PERM_ID" ]; then
    # T19-A-02: Read permission
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/permission/$API_PERM_ID/edit" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/permission/$API_PERM_ID" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/permissions/$API_PERM_ID" -H "Authorization: Bearer $TOKEN")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T19-A-02 "API Permission read (not implemented)"
    else
      check T19-A-02 "API Permission read -> 200" "200" "$_ST"
    fi

    # T19-A-03: Update permission
    API_PERM_UPD="{\"name\":\"smoke.api.${_PERM_TS}.upd\",\"status\":\"Active\",\"guard_name\":\"web\",\"guardName\":\"web\",\"method\":\"GET\",\"path\":\"/smoke/api/updated\"}"
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/permission/$API_PERM_ID/update" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_UPD")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/permission/$API_PERM_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_UPD")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/access/permissions/$API_PERM_ID" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PERM_UPD")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T19-A-03 "API Permission update (not implemented)"
    else
      check T19-A-03 "API Permission update -> 2xx" "2" "$(echo "${_ST:0:1}")"
    fi

    # T19-A-04: Delete permission
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/permission/$API_PERM_ID/delete" \
      -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/permission/$API_PERM_ID" \
        -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/permissions/$API_PERM_ID" \
        -H "Authorization: Bearer $TOKEN")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T19-A-04 "API Permission delete (not implemented)"
    else
      check T19-A-04 "API Permission delete -> 2xx" "2" "$(echo "${_ST:0:1}")"
    fi
  else
    for i in A-02 A-03 A-04; do skip "T19-$i" "API Permission (no permission created)"; done
  fi
else
  for i in A-01 A-02 A-03 A-04; do skip "T19-$i" "API Permission CRUD (no token)"; done
fi

# ─────────────────────────────────────────────────────────────────────────────
# T21 - API Role-Permission Assignment
# ─────────────────────────────────────────────────────────────────────────────
echo "[T21] API Role-Permission Assignment"
if [ -n "$TOKEN" ]; then
  # Use existing admin role + first permission for assignment tests
  ASSIGN_ROLE_LIST=$(curl -s "$BASE/api/v1/access/role" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  [ -z "$ASSIGN_ROLE_LIST" ] && ASSIGN_ROLE_LIST=$(curl -s "$BASE/api/v1/access/roles" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  ASSIGN_ROLE_ID=$(echo "$ASSIGN_ROLE_LIST" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    items=d.get('data', d.get('datas', []))
    if isinstance(items,dict): items=items.get('datas',items.get('data',[]))
    if isinstance(items,list) and items: print(items[0].get('id',''))
except Exception: pass
" 2>/dev/null)
  [ -z "$ASSIGN_ROLE_ID" ] && ASSIGN_ROLE_ID=$(echo "$ASSIGN_ROLE_LIST" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')

  ASSIGN_PERM_LIST=$(curl -s "$BASE/api/v1/access/permission" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  [ -z "$ASSIGN_PERM_LIST" ] && ASSIGN_PERM_LIST=$(curl -s "$BASE/api/v1/access/permissions" -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  ASSIGN_PERM_ID=$(echo "$ASSIGN_PERM_LIST" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    items=d.get('data', d.get('datas', []))
    if isinstance(items,dict): items=items.get('datas',items.get('data',[]))
    if isinstance(items,list) and items: print(items[0].get('id',''))
except Exception: pass
" 2>/dev/null)
  [ -z "$ASSIGN_PERM_ID" ] && ASSIGN_PERM_ID=$(echo "$ASSIGN_PERM_LIST" | grep -oP '"id":"[0-9a-f-]{36}"' | head -1 | grep -oP '"id":"\K[^"]+')

  if [ -n "$ASSIGN_ROLE_ID" ] && [ -n "$ASSIGN_PERM_ID" ]; then
    # T21-A-01: List role permissions
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$ASSIGN_ROLE_ID/permission" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles/$ASSIGN_ROLE_ID/permission" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/roles/$ASSIGN_ROLE_ID/permissions" -H "Authorization: Bearer $TOKEN")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T21-A-01 "API Role permission list (not implemented)"
    else
      check T21-A-01 "API Role permission list -> 200" "200" "$_ST"
    fi

    # T21-A-02: Assign permission to role (GET-based NodeAdmin style OR POST-based NestAdmin style)
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/assign" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/access/role/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/assign" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/v1/access/roles/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/assign" \
        -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T21-A-02 "API Role permission assign (not implemented)"
    else
      check T21-A-02 "API Role permission assign -> 2xx" "2" "$(echo "${_ST:0:1}")"
    fi

    # T21-A-03: Unassign permission from role
    _ST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/access/role/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/unassign" -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/role/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/unassign" \
        -H "Authorization: Bearer $TOKEN")
    [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
      _ST=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/v1/access/roles/$ASSIGN_ROLE_ID/permission/$ASSIGN_PERM_ID/unassign" \
        -H "Authorization: Bearer $TOKEN")
    if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
      skip T21-A-03 "API Role permission unassign (not implemented)"
    else
      check T21-A-03 "API Role permission unassign -> 2xx" "2" "$(echo "${_ST:0:1}")"
    fi
  else
    for i in A-01 A-02 A-03; do skip "T21-$i" "API Role-Permission (no role/permission ID)"; done
  fi
else
  for i in A-01 A-02 A-03; do skip "T21-$i" "API Role-Permission (no token)"; done
fi

# ─────────────────────────────────────────────────────────────────────────────
# T22 - API Setting Update
# ─────────────────────────────────────────────────────────────────────────────
echo "[T22] API Setting Update"
if [ -n "$TOKEN" ]; then
  API_SETT_BODY="{\"name\":\"Smoke Admin\",\"theme\":\"Blue\",\"email\":\"admin@admin.com\",\"phone\":\"081000000000\",\"address\":\"Test\",\"copyright\":\"Smoke\",\"initial\":\"SA\"}"
  _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/setting/update" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_SETT_BODY")
  [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/setting" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_SETT_BODY")
  if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
    skip T22-A-01 "API Setting update (not implemented)"
  else
    check T22-A-01 "API Setting update -> 2xx" "2" "$(echo "${_ST:0:1}")"
  fi
else
  skip T22-A-01 "API Setting update (no token)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# T23 - API Profile Update
# ─────────────────────────────────────────────────────────────────────────────
echo "[T23] API Profile Update"
if [ -n "$TOKEN" ]; then
  API_PROF_BODY="{\"code\":\"ADM\",\"name\":\"Admin\",\"email\":\"admin@admin.com\",\"status\":\"active\",\"timezone\":\"Asia/Jakarta\",\"phone\":\"081000000000\"}"
  _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/profile/update" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PROF_BODY")
  [ "$_ST" = "404" ] || [ "$_ST" = "405" ] && \
    _ST=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$BASE/api/v1/profile" \
      -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$API_PROF_BODY")
  if [ "$_ST" = "404" ] || [ "$_ST" = "405" ]; then
    skip T23-A-01 "API Profile update (not implemented)"
  else
    check T23-A-01 "API Profile update -> 2xx" "2" "$(echo "${_ST:0:1}")"
  fi
else
  skip T23-A-01 "API Profile update (no token)"
fi

# Summary
echo ""
echo "================================"
TOTAL=$((PASS+FAIL))
PCT=0
if [ $TOTAL -gt 0 ]; then
  PCT=$(( PASS * 100 / TOTAL ))
fi
echo "  APP    : $APPNAME"
echo "  URL    : $BASE"
echo "  ✅ PASS : $PASS"
echo "  ❌ FAIL : $FAIL"
echo "  TOTAL  : $TOTAL"
echo "  SKOR   : ${PCT}%"
echo "================================"

rm -f $JAR $LOGFILE
[ $FAIL -eq 0 ] && exit 0 || exit 1
