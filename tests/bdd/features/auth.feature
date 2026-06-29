Feature: Autentikasi admin
  Sebagai admin, saya ingin masuk ke panel agar dapat mengelola sistem.

  Scenario: Login berhasil dengan kredensial benar
    Given saya di halaman login
    When saya login sebagai admin dengan password benar
    Then saya diarahkan ke dashboard

  Scenario: Login gagal dengan password salah
    Given saya di halaman login
    When saya login sebagai admin dengan password salah
    Then saya tetap diarahkan ke halaman login

  Scenario: Akses halaman admin tanpa login ditolak
    When saya membuka "/admin/v1/access/user" tanpa login
    Then saya diarahkan ke halaman login
