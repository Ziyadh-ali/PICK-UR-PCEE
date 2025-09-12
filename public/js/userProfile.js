      const email = document.getElementById("email");
      const firstName = document.getElementById("firstName");
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
      const validateInputs = () => {
        isValid = true;
        
        const firstNameValue = firstName.value.trim();
        const mobileValue = mobile.value.trim();

        if (firstNameValue === "") {
          setError(firstName, "First Name is required");
        } else {
          setSuccess(firstName);
        }
        if (mobileValue.length >=1 && mobileValue.length !== 10) {
          setError(mobile, "Mobile Number should'nt be less than 10");
        } else {
          setSuccess(mobile);
        }

        return isValid;
      };
      document.getElementById("form1").addEventListener("submit", (e) => {
        e.preventDefault();
        if (validateInputs()) {
          const lastName = document.getElementById("lastName").value;
          const firstName = document.getElementById("firstName").value;
          const mobile = document.getElementById("mobile").value;
          $.ajax({
            url: "/account",
            type: "PATCH",
            data: {
                lastName,
                firstName,
                mobile
            },
            success: function (response) {
              if (response.success) {
                showToast("Updated successfully", "success");
              } else {
                showToast(response.message, "error");
              }
            },
            error: function (error) {
              showToast("Request failed" + error, "error");
            },
          });
        }
      });
    //   function showToast(message, type) {
    //     let backgroundColor;

    //     if (type === "success") {
    //       backgroundColor = "green";
    //     } else if (type === "error") {
    //       backgroundColor = "red";
    //     } else {
    //       backgroundColor = "gray";
    //     }

    //     Toastify({
    //       text: message,
    //       duration: 2000,
    //       close: true,
    //       gravity: "top",
    //       position: "right",
    //       backgroundColor: backgroundColor,
    //     }).showToast();
    //   }