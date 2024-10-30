
function addWishlist(productId){
    $.ajax({
        url: "/wishlist",
        method: "POST",
        data: {
            productId: productId,
        },
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    title: "Added to Wishlist",
                    icon: "success",
                    showConfirmButton : false,
                    timer : 1000
                });
                $("#productContainer").load("/shop #productContainer")
            } else {
                Swal.fire({
                    title: "error",
                    icon: "error",
                    showConfirmButton : false,
                    timer : 3000
                });
            }
        },
        error : function (error){
            Swal.fire({
                title: "error"+error,
                icon: "error",
                showConfirmButton : false,
                timer : 3000
            });
        }
    })
}

function removeWishlist(productId){
    $.ajax({
        url: `/wishlistRemove/${productId}`,
        method: "DELETE",
        success: function (response) {
            if (response.success) {
                Swal.fire({
                    title: "Removed successfully",
                    icon: "success",
                    showConfirmButton : false,
                    timer : 1000
                });
                $("#productContainer").load("/shop #productContainer")
            } else {
                Swal.fire({
                    title: "error in removing",
                    icon: "error",
                    showConfirmButton : false,
                    timer : 3000
                });
            }
        },
        error : function (error){
            Swal.fire({
                title: "error"+error,
                icon: "error",
                showConfirmButton : false,
                timer : 3000
            });
        }
    })
}