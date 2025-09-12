
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
  
  // Validation function
  const validateInputs = () => {
    isValid = true;
    const fullName = document.getElementById("fullName");
    const mobile = document.getElementById("addMobile");
    const address = document.getElementById("address");
    const city = document.getElementById("city");
    const state = document.getElementById("state");
    const pincode = document.getElementById("pincode");
    const type = document.getElementById("type");
  
    if (fullName.value.trim() === "") {
      setError(fullName, "Full Name is required");
    } else {
      setSuccess(fullName);
    }
  
    if (mobile.value.trim() === "") {
      setError(mobile, "Mobile Number is required");
    } else if (mobile.value.length !== 10) {
      setError(mobile, "Mobile Number should be exactly 10 digits");
    } else {
      setSuccess(mobile);
    }
  
    if (address.value.trim() === "") {
      setError(address, "Address is required");
    } else {
      setSuccess(address);
    }
  
    if (city.value.trim() === "") {
      setError(city, "City is required");
    } else {
      setSuccess(city);
    }
  
    if (state.value === "") {
      setError(state, "State is required");
    } else {
      setSuccess(state);
    }
  
    if (pincode.value.trim() === "") {
      setError(pincode, "Pincode is required");
    } else {
      setSuccess(pincode);
    }

    if (type.value === "") {
        setError(type, "Address type is required");
      } else {
        setSuccess(type);
      }
  
    return isValid;
  };
  
  // Form submission event listener
  document.getElementById("editAddress").addEventListener("submit", (event) => {
    event.preventDefault();
    if (validateInputs()) {
      const formData = $(event.currentTarget).serialize();
      const submitButton = event.submitter; 
      const name = $(submitButton).data("fullname");
      $.ajax({
        url: `/address/${name}`,
        method: "PATCH",
        data: formData,
        success: (response) => {
          if (response.success) {
            showToast("Address added successfully", "success");
            window.history.back()
          } else {
            showToast(response.message, "error");
          }
        },
        error: (error) => {
          showToast("Request failed: " + error.responseText, "error");
        },
      });
    }
  });

function showToast(message, type) {
    let backgroundColor;
  
    if (type === "success") {
      backgroundColor = "green";
    } else if (type === "error") {
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