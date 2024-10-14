const form = document.getElementById('form');
const firstName = document.getElementById('firstName');
const email = document.getElementById('email');
const mobile = document.getElementById('mobile');
const password = document.getElementById('password');
const confirmPass = document.getElementById('confirmPass');

let isValid = true; // This will control whether the form is valid

const setError = (value, message) => {
    const inputControl = value.parentElement;
    const errorDisplay = inputControl.querySelector('.error');
    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success');
    isValid = false; // If there's an error, set x to false
}

const setSuccess = value => {
    const inputControl = value.parentElement;
    const errorDisplay = inputControl.querySelector('.error');
    errorDisplay.innerText = '';
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
}

const isValidEmail = email => {
    const valEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return valEmail.test(String(email).toLowerCase());
}

const isValidPass = password => {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordPattern.test(password);
}

const validateInputs = () => {
    isValid = true; 

    const firstNameValue = firstName.value.trim();
    const emailValue = email.value.trim();
    const mobileValue = mobile.value.trim();
    const passwordValue = password.value.trim();
    const confirmPassValue = confirmPass.value.trim();

    if (firstNameValue === "") {
        setError(firstName, "First name is required");
    } else {
        setSuccess(firstName);
    }

    if (emailValue === "") {
        setError(email, "Email is required");
    } else if (!isValidEmail(emailValue)) {
        setError(email, "Invalid email format");
    } else {
        setSuccess(email);
    }

    if (mobileValue === "") {
        setError(mobile, "Mobile number is required");
    } else if (mobileValue.length !== 10) {
        setError(mobile, "Mobile number should be 10 digits");
    } else {
        setSuccess(mobile);
    }

    if (passwordValue === "") {
        setError(password, "Password is required");
    } else if (!isValidPass(passwordValue)) {
        setError(password, "Password must be at least 8 characters long, with one uppercase, one digit, and one special character");
    } else {
        setSuccess(password);
    }

    if (confirmPassValue === "") {
        setError(confirmPass, "Confirm Password is required");
    } else if (confirmPassValue !== passwordValue) {
        setError(confirmPass, "Passwords do not match");
    } else {
        setSuccess(confirmPass);
    }
    return isValid;
}

form.addEventListener('submit', function (event) {
    event.preventDefault(); 

    if (validateInputs()) {
        const formData = $(this).serialize(); 
        $.ajax({
            url: '/register',
            type: 'POST',
            data: formData,
            success: function (response) {
                if (response.success) {
                    window.location.href = "/otp";
                } else {
                    showToast(response.message, "error");
                }
            },
            error: function (xhr, status, error) {
                
                showToast("Request failed: " + error, "error");
            }
        });
    }
});


function showToast(message, type) {
    let backgroundColor;

    if (type === 'success') {
        backgroundColor = "green";
    } else if (type === 'error') {
        backgroundColor = "red";
    } else {
        backgroundColor = "gray";
    }

    Toastify({
        text: message,
        duration: 2000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: backgroundColor,
    }).showToast();
}
