Feature: Template switcher
  Sebagai admin, saya ingin mengganti template agar tampilan sesuai preferensi.

  Background:
    Given saya login sebagai admin

  Scenario: Halaman setting menampilkan pilihan tema
    When saya membuka halaman setting
    Then saya melihat pilihan tema

  Scenario: Mengganti tema tersimpan
    When saya mengganti tema ke "Green"
    Then tema aktif menjadi "Green"
