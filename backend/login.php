<?php
session_start();
require "db.php";

$username = $_POST["username"];
$password = $_POST["password"];

$sql = "SELECT * FROM users 
        WHERE username='$username' 
        OR email='$username'";

$result = $conn->query($sql);

// Check if user exists
if ($result->num_rows == 1) {

    $user = $result->fetch_assoc();

    // Verify password
    if (password_verify($password, $user["password"])) {

        // Backend session
        $_SESSION["user"] = $user["username"];

        // Send JavaScript to browser
     echo "
<script>
    // Save login to browser
    localStorage.setItem('shopwave-user', JSON.stringify({
        username: '{$user['username']}',
        email: '{$user['email']}'
    }));

    // If user tried to access something before login
    let intended = localStorage.getItem('shopwave-intended');

    if (intended) {
        localStorage.removeItem('shopwave-intended');

        // Auto-fix path so it always points to /frontend/
        if (!intended.startsWith('../frontend/')) {
            intended = '../frontend/' + intended;
        }

        window.location.href = intended;
    } else {
        window.location.href = '../frontend/home.html';
    }
</script>
";
exit();


    } else {
        echo "Invalid Password";
    }

} else {
    echo "User not found";
}
?>
