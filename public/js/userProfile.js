const email = document.getElementById("email");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const mobile = document.getElementById("mobile");

let isValid = true; // Track form validity

const setError = (input, message) => {
  const inputControl = input.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = message;
  inputControl.classList.add("error");
  inputControl.classList.remove("success");
  isValid = false;
};

const setSuccess = (input) => {
  const inputControl = input.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = "";
  inputControl.classList.add("success");
  inputControl.classList.remove("error");
};

// ✅ Validation rules
const validateInputs = () => {
  isValid = true;

  const firstNameValue = firstName.value.trim();
  const lastNameValue = lastName.value.trim();
  const emailValue = email.value.trim();
  const mobileValue = mobile.value.trim();

  // First name validation
  if (firstNameValue === "") {
    setError(firstName, "First name is required");
  } else if (!/^[A-Za-z]{2,30}$/.test(firstNameValue)) {
    setError(firstName, "First name must be 2–30 letters only");
  } else {
    setSuccess(firstName);
  }

  // Last name validation (optional but if present must be valid)
  if (lastNameValue && !/^[A-Za-z]{1,30}$/.test(lastNameValue)) {
    setError(lastName, "Last name must be letters only (max 30)");
  } else {
    setSuccess(lastName);
  }


  // Mobile validation
  if (mobileValue === "") {
    setError(mobile, "Mobile number is required");
  } else if (!/^[0-9]{10}$/.test(mobileValue)) {
    setError(mobile, "Mobile number must be exactly 10 digits");
  } else {
    setSuccess(mobile);
  }

  return isValid;
};

// ✅ Submit handler
document.getElementById("form1").addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateInputs()) {
    const data = {
      lastName: lastName.value.trim(),
      firstName: firstName.value.trim(),
      email: email.value.trim(),
      mobile: mobile.value.trim(),
    };

    $.ajax({
      url: "/account",
      type: "PATCH",
      data,
      success: function (response) {
        if (response.success) {
          showToast("Updated successfully", "success");
        } else {
          showToast(response.message, "error");
        }
      },
      error: function (error) {
        showToast("Request failed: " + error, "error");
      },
    });
  }
});
