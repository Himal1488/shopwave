<?php
function validPassword($password){
    return preg_match('/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/', $password);
}
?>
