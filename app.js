// DOM Elements
const uploadInput = document.getElementById('upload');
const removeBgBtn = document.getElementById('removeBgBtn');
const bgButtons = document.querySelectorAll('.bgBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const sheetCanvas = document.getElementById('sheetCanvas');
const sheetCtx = sheetCanvas.getContext('2d');
const sheetSizeSelect = document.getElementById('sheetSize');
const generateSheetBtn = document.getElementById('generateSheet');
const downloadBtn = document.getElementById('downloadBtn');
const printBtn = document.getElementById('printBtn');
const loading = document.getElementById('loading');

// Sliders for Manual Adjustment
const zoomRange = document.getElementById('zoomRange');
const moveXSlider = document.getElementById('moveX');
const moveYSlider = document.getElementById('moveY');

// configuration - અહિયાં તમારી remove.bg ની API કી મૂકો
const REMOVE_BG_API_KEY = "YOUR_REMOVE_BG_API_KEY"; 

// Global Variables
let originalImage = null;       
let processedImageBlob = null;  
let currentBgColor = '#ffffff'; 
const passportWidth = 413;      
const passportHeight = 531;     

// Adjustment values
let zoom = 1;
let offsetX = 0;
let offsetY = 0;

// 1. Photo Upload Event
uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                processedImageBlob = originalImage; 
                resetSliders();
                drawPassportPhoto();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Reset sliders on new image upload
function resetSliders() {
    zoomRange.value = 1;
    moveXSlider.value = 0;
    moveYSlider.value = 0;
    zoom = 1;
    offsetX = 0;
    offsetY = 0;
}

// Sliders Event Listeners - સ્લાઈડર ફેરવતા જ ફોટો એડજસ્ટ થશે
zoomRange.addEventListener('input', (e) => { zoom = parseFloat(e.target.value); drawPassportPhoto(); });
moveXSlider.addEventListener('input', (e) => { offsetX = parseInt(e.target.value); drawPassportPhoto(); });
moveYSlider.addEventListener('input', (e) => { offsetY = parseInt(e.target.value); drawPassportPhoto(); });

// 2. Real AI Background Removal via remove.bg API
removeBgBtn.addEventListener('click', async () => {
    const file = uploadInput.files[0];
    if (!file) {
        alert("કૃપા કરીને પહેલા ફોટો અપલોડ કરો!");
        return;
    }
    
    if (REMOVE_BG_API_KEY === "YOUR_REMOVE_BG_API_KEY") {
        alert("કૃપા કરીને પહેલા કોડમાં તમારી remove.bg API Key ઉમેરો!");
        return;
    }
    
    loading.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('size', 'auto');

    try {
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': REMOVE_BG_API_KEY
            },
            body: formData
        });

        if (!response.ok) throw new Error('API Response Error');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const img = new Image();
        img.onload = function() {
            processedImageBlob = img; 
            drawPassportPhoto();      
            loading.style.display = 'none'; 
            alert("AI દ્વારા બેકગ્રાઉન્ડ સફળતાપૂર્વક રીમુવ થઈ ગયું છે!");
        };
        img.src = url;
        
    } catch (error) {
        console.error(error);
        loading.style.display = 'none';
        alert("બેકગ્રાઉન્ડ રીમુવ કરવામાં ભૂલ આવી.");
    }
});

// 3. Background Color Selection
bgButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        bgButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentBgColor = e.target.getAttribute('data-color');
        
        if (processedImageBlob) {
            drawPassportPhoto(); 
        }
    });
});

// Draw Passport Photo Function (With Zoom and Offset Adjustment)
function drawPassportPhoto() {
    if (!processedImageBlob) return;

    ctx.clearRect(0, 0, passportWidth, passportHeight);

    // Fill Background Color
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, passportWidth, passportHeight);

    // Initial Base Aspect Ratio Fit Logic
    const imgRatio = processedImageBlob.width / processedImageBlob.height;
    const canvasRatio = passportWidth / passportHeight;
    
    let baseWidth, baseHeight;

    if (imgRatio > canvasRatio) {
        baseHeight = passportHeight;
        baseWidth = passportHeight * imgRatio;
    } else {
        baseWidth = passportWidth;
        baseHeight = passportWidth / imgRatio;
    }

    // Apply Zoom (Scale)
    const finalWidth = baseWidth * zoom;
    const finalHeight = baseHeight * zoom;

    // Apply Center alignment + Manual Offset from sliders
    const drawX = (passportWidth - finalWidth) / 2 + offsetX;
    const drawY = (passportHeight - finalHeight) / 2 + offsetY;

    // Draw the Image onto Canvas
    ctx.drawImage(processedImageBlob, drawX, drawY, finalWidth, finalHeight);
}

// 4. Generate Print Sheet
generateSheetBtn.addEventListener('click', () => {
    if (!processedImageBlob) {
        alert("કૃપા કરીને પહેલા પાસપોર્ટ ફોટો તૈયાર કરો!");
        return;
    }

    const size = sheetSizeSelect.value;
    let cols = 0, rows = 0;

    if (size === '4x6') {
        sheetCanvas.width = 1200;
        sheetCanvas.height = 1800;
        cols = 2; rows = 3;
    } else if (size === '5x7') {
        sheetCanvas.width = 1500;
        sheetCanvas.height = 2100;
        cols = 3; rows = 3;
    } else if (size === 'A4') {
        sheetCanvas.width = 2480;
        sheetCanvas.height = 3508;
        cols = 5; rows = 6;
    }

    sheetCtx.fillStyle = '#ffffff';
    sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

    const paddingX = (sheetCanvas.width - (cols * passportWidth)) / (cols + 1);
    const paddingY = (sheetCanvas.height - (rows * passportHeight)) / (rows + 1);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = paddingX + c * (passportWidth + paddingX);
            const y = paddingY + r * (passportHeight + paddingY);
            
            sheetCtx.drawImage(canvas, x, y, passportWidth, passportHeight);
            
            sheetCtx.strokeStyle = '#cccccc';
            sheetCtx.lineWidth = 2;
            sheetCtx.strokeRect(x, y, passportWidth, passportHeight);
        }
    }
    
    alert(`પ્રિન્ટ શીટ (${size}) તૈયાર છે! નીચે જુઓ.`);
});

// 5. Download PNG
downloadBtn.addEventListener('click', () => {
    if (!processedImageBlob) {
        alert("ડાઉનલોડ કરવા માટે કોઈ ફોટો નથી!");
        return;
    }
    const link = document.createElement('a');
    link.download = 'passport_print_sheet.png';
    link.href = sheetCanvas.toDataURL('image/png');
    link.click();
});

// 6. Print Function
printBtn.addEventListener('click', () => {
    if (!processedImageBlob) {
        alert("પ્રિન્ટ કરવા માટે કોઈ શીટ જનરેટ થયેલ નથી!");
        return;
    }
    const dataUrl = sheetCanvas.toDataURL();
    const windowContent = '<!DOCTYPE html><html><head><title>Print Passport</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center;">' + '<img src="' + dataUrl + '" style="max-width:100%; height:auto;">' + '</body></html>';
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
});
