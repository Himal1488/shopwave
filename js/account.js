/* USER DATA */
const user = JSON.parse(localStorage.getItem("shopwave-user"));
document.getElementById("welcomeUser").innerText =
    "Hello, " + user.username.toUpperCase();

/* UNIQUE PROFILE PICTURE KEY */
const picKey = "profile-picture-" + user.username;

/* LOAD PICTURE */
if (localStorage.getItem(picKey)) {
    document.getElementById("profilePreview").src =
        localStorage.getItem(picKey);
}

/* UPLOAD HANDLING */
const uploadArea = document.getElementById("uploadArea");
const inputFile = document.getElementById("profileInput");
let tempImage = null;

uploadArea.addEventListener("click", () => inputFile.click());

inputFile.addEventListener("change", (e) => {
    previewImage(e.target.files[0]);
});

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
});
uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    previewImage(e.dataTransfer.files[0]);
});

/* PREVIEW FUNCTION */
function previewImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
        tempImage = reader.result;
        document.getElementById("profilePreview").src = tempImage;
    };
    reader.readAsDataURL(file);
}

/* SAVE PICTURE */
document.getElementById("savePicBtn").addEventListener("click", () => {
    if (!tempImage) return alert("Please upload an image first.");

    localStorage.setItem(picKey, tempImage);
    alert("Profile picture saved!");
});

/* LOGOUT */
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("shopwave-user");
    window.location.href = "home.html";
});

/* THEME */
const themeSwitch = document.getElementById("themeSwitch");

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeSwitch.checked = true;
}

themeSwitch.addEventListener("change", () => {
    if (themeSwitch.checked) {
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
    } else {
        document.body.classList.remove("dark-mode");
        localStorage.setItem("theme", "light");
    }
});
