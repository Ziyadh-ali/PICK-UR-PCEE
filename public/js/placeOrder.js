

let form = document.getElementById('orderDetails');


form.addEventListener('submit', function(event) {
    event.preventDefault();
    let selectedAddressElement = document.querySelector('.address-radio:checked');
    let selectedAddress = null;
    
    if (selectedAddressElement) {
        
        let addressPanel = selectedAddressElement.closest('.address-panel');
        
                // Extract the full address details from the panel
                selectedAddress = {
                    fullName: addressPanel.querySelector('strong').innerText,
                    addressType: addressPanel.querySelector('span').innerText,
                    address: addressPanel.querySelector('.address').innerText,
                    city: addressPanel.querySelector('.city').innerText,
                    state: addressPanel.querySelector('.state').innerText,
                    mobile: addressPanel.querySelector('.mobile').innerText,
                    pincode: addressPanel.querySelector('.pincode').innerText,
                    altMobile: addressPanel.querySelector('.altMobile') 
                        ? addressPanel.querySelector('.altMobile').innerText 
                        : null
                };
    }
    
    if(!selectedAddress){
        return Toastify({
            text: "Please select a address",
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: "#dc3545",
          }).showToast();
    }
    let paymentElement = document.querySelector('input[name="payment"]:checked');
    let selectedPaymentMethod = paymentElement ? paymentElement.value : null;
    const totalPriceText = document.getElementById("totalPrice").innerHTML;
    const totalPrice = totalPriceText.replace(/[^\d.-]/g, '');

    
   

    
    let orderData = {
        totalPrice,
        address: selectedAddress,
        paymentMethod: selectedPaymentMethod,
    };

    if(selectedPaymentMethod === "Cash on Delivery"){
        if(totalPrice >= 1000){
            return showToast("order above 1000 should'nt order cash on delivery","error");
        }
        $.ajax({
            url: '/checkout/placeOrder',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(orderData),
            success: function(response) {
                window.location.href = '/orderSuccess';
            },
            error: function(error) {
                showToast('An error occurred: ' + error,"error");
            }
        });
    }else if (selectedPaymentMethod === "Paypal"){
        $.ajax({
            url: "/checkout/payWithPaypal",
            type: "POST",
            data:  orderData,
            success: function (response) {
              if (response.success && response.redirectUrl) {
                window.location.href = response.redirectUrl;
              } else {
                Toastify({
                  text: "Payment error",
                  duration: 3000,
                  gravity: "top",
                  position: "right",
                  backgroundColor: "#dc3545",
                }).showToast();
              }
            },
            error: function () {
              Toastify({
                text: "An error occurred",
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: "#dc3545",
              }).showToast();
            },
          });
        }
});