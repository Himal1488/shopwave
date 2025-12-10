<?php
session_start();
require "db.php";
require "validate_password.php";

$username = $_POST["username"];
$firstname = $_POST["firstname"];
$lastname = $_POST["lastname"];
$email = $_POST["email"];
$otp = $_POST["otp"];
$password = $_POST["password"];

if($_SESSION['otp'] != $otp){
    die("Invalid OTP");
}

if(!validPassword($password)){
    die("Password does not meet requirements.");
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

$sql = "INSERT INTO users(username, firstname, lastname, email, password)
        VALUES('$username','$firstname','$lastname','$email','$hashed')";

if($conn->query($sql)){
    header("Location: ../frontend/login.html");
}
else{
    echo "Error: " . $conn->error;
}
?>
