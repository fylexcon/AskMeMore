@echo off
echo ========================================================
echo LUTFEN TELEFONUNUZU KABLOYLA BILGISAYARA BAGLAYIN
echo VE "USB HATA AYIKLAMA" (USB DEBUGGING) ACIK OLDUGUNDAN EMIN OLUN.
echo ========================================================
pause
echo.
echo Telefonunuz algilaniyor...
.\platform-tools\adb.exe devices
echo.
echo Loglar temizleniyor...
.\platform-tools\adb.exe logcat -c
echo.
echo ========================================================
echo SIMDI TELEFONUNUZDAN "Ask Me More" UYGULAMASINI ACIN!
echo Uygulama coktukten 3 saniye sonra herhangi bir tusa basin.
echo ========================================================
pause
echo.
echo Hata loglari aliniyor... Lutfen bekleyin...
.\platform-tools\adb.exe logcat -d > crash_log.txt
echo.
echo ISLEM TAMAMLANDI! 
echo Lutfen proje klasorundeki "crash_log.txt" dosyasinin icinde 
echo "FATAL EXCEPTION" yazan yeri kopyalayip bana gonderin!
pause
