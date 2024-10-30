

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
    
   
    let paymentElement = document.querySelector('input[name="payment"]:checked');
    let selectedPaymentMethod = paymentElement ? paymentElement.value : null;
    

    
   
    let couponCode = document.getElementById('coupons').value;

    
    let orderData = {
        address: selectedAddress,
        paymentMethod: selectedPaymentMethod,
        coupon: couponCode
    };

    
    $.ajax({
        url: '/checkout/placeOrder',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(orderData),
        success: function(response) {
            window.location.href = '/orderSuccess';
        },
        error: function(error) {
            // Handle the error response
            showToast('An error occurred: ' + error,"error");
        }
    });
});