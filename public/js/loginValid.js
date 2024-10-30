    const form = document.getElementById('form');
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    let isValid = true;  // Track form validity

    const setError = (input, message) => {
        const inputControl = input.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = message;
        inputControl.classList.add('error');
        inputControl.classList.remove('success');
        isValid = false;
    };

    const setSuccess = (input) => {
        const inputControl = input.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = '';
        inputControl.classList.add('success');
        inputControl.classList.remove('error');
    };

    const validateInputs = () => {
        isValid = true;
        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();

        if (emailValue === "") {
            setError(email, "Email is required");
        } else {
            setSuccess(email);
        }

        if (passwordValue === "") {
            setError(password, "Password is required");
        } else {
            setSuccess(password);
        }

        return isValid;
    };

    form.addEventListener('submit', function (event) {
        event.preventDefault(); 

        if (validateInputs()) {
            const formData = $(this).serialize(); 
            $.ajax({
                url: '/login',
                type: 'POST',
                data: formData,
                success: function (response) {
                    if (response.success) {
                        window.location.href = "/";
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