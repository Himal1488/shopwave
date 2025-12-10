<?php
session_start();
require "db.php";
require "mailer/PHPMailer.php";
require "mailer/SMTP.php";
require "mailer/Exception.php";

use PHPMailer\PHPMailer\PHPMailer;

$email = $_POST['email'];

$otp = rand(100000, 999999);
$_SESSION['otp'] = $otp;
$_SESSION['email'] = $email;

$mail = new PHPMailer(true);
$mail->isSMTP();
$mail->Host = "smtp.gmail.com";
$mail->SMTPAuth = true;
$mail->Username = "shopwave2022@gmail.com";
$mail->Password = "wzdb ouik zocb odgc";
$mail->Port = 587;
$mail->SMTPSecure = "tls";

$mail->setFrom("yourgmail@gmail.com", "ShopWave Verification");
$mail->addAddress($email);
$mail->Subject = "ShopWave Email Verification";
$mail->Body = "Your OTP is: $otp";

if($mail->send()){
    echo "OTP Sent Successfully";
} else {
    echo "Failed: " . $mail->ErrorInfo;
}
?>
