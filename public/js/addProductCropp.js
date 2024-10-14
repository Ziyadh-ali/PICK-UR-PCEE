document.addEventListener('DOMContentLoaded',function(){
    const form = document.getElementById('productForm');
    const upload = document.querySelector('#productImages');
    const imgContainer = document.querySelector('#croppieContainer');
    let croppieInstances = [];

    upload.addEventListener('change',function (event){
        const files = event.target.files;
        imgContainer.innerHTML = '';
        croppieInstances = [];

        Array.from(files).forEach((fie,index)=>{
            const reader = new FileReader();
            const croppieDiv = document.createElement('div');
            croppieDiv.id = `croppieInstances_${index}`;
            imgContainer.appendChild(croppieDiv);

            reader.onload = function (event) {
                const croppieInstances = new croppieDiv(croppieDiv, {
                    viewport : {width: 400 , height:550 , type : 'square'},
                    boundary: {width:450}
                })
            }
        })
    })
})