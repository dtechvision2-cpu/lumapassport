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
const REMOVE_BG_API_KEY = "iEC5Uw4xYSwHwTXKWkvwFrec"; 

// Global Variables
let originalImage = null;       
let processedImageBlob = null;  
let currentBgColor = '#ffffff'; 

// પાસપોર્ટ સાઇઝની સ્ટાન્ડર્ડ પ્રિવ્યૂ સાઇઝ
const passportWidth = 413;  
const passportHeight = 531; 

// Adjustment values
let zoom = 1;
let offsetX = 0;
let offsetY = 0;

// Performance Optimization: તીવ્ર લેગ રોકવા માટે ફ્રેમ કંટ્રોલ વેરીએબલ
let isTicking = false;

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
                canvas.width = passportWidth;
                canvas.height = passportHeight;
                requestUpdate();
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

// Optimization: સ્લાઈડર સ્મૂથ કરવા માટે RequestAnimationFrame ફંક્શન
function requestUpdate() {
    if (!isTicking) {
        requestAnimationFrame(() => {
            drawPassportPhoto();
            isTicking = false;
        });
        isTicking = true;
    }
}

// Sliders Event Listeners - હવે ગમે તેટલી સ્પીડમાં ફેરવશો તોય લેગ નહિ થાય
zoomRange.addEventListener('input', (e) => { zoom = parseFloat(e.target.value); requestUpdate(); });
moveXSlider.addEventListener('input', (e) => { offsetX = parseInt(e.target.value); requestUpdate(); }); 
moveYSlider.addEventListener('input', (e) => { offsetY = parseInt(e.target.value); requestUpdate(); }); 

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
            canvas.width = passportWidth;
            canvas.height = passportHeight;
            requestUpdate();      
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
            requestUpdate(); 
        }
    });
});

// Helper Function: ફોટો ડ્રો કરવાની ગણતરી (બંને કેનવાસ માટે સેમ રહેશે)
function calculateDrawDimensions(img, targetW, targetH, currentZoom, currentX, currentY) {
    const imgRatio = img.width / img.height;
    const canvasRatio = targetW / targetH;
    
    let baseWidth, baseHeight;

    if (imgRatio > canvasRatio) {
        baseHeight = targetH;
        baseWidth = targetH * imgRatio;
    } else {
        baseWidth = targetW;
        baseHeight = targetW / imgRatio;
    }

    const finalWidth = baseWidth * currentZoom;
    const finalHeight = baseHeight * currentZoom;

    const drawX = (targetW - finalWidth) / 2 + currentX;
    const drawY = (targetH - finalHeight) / 2 + currentY;

    return { drawX, drawY, finalWidth, finalHeight };
}

// Draw Passport Photo Function (Preview Canvas)
function drawPassportPhoto() {
    if (!processedImageBlob) return;

    ctx.clearRect(0, 0, passportWidth, passportHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill Background Color
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, passportWidth, passportHeight);

    // ગણતરી મેળવો
    const dims = calculateDrawDimensions(processedImageBlob, passportWidth, passportHeight, zoom, offsetX, offsetY);

    ctx.drawImage(processedImageBlob, dims.drawX, dims.drawY, dims.finalWidth, dims.finalHeight);
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

    sheetCtx.clearRect(0, 0, sheetCanvas.width, sheetCanvas.height);
    sheetCtx.fillStyle = '#ffffff';
    sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

    sheetCtx.imageSmoothingEnabled = true;
    sheetCtx.imageSmoothingQuality = 'high';

    const targetWidth = 413;
    const targetHeight = 531;

    const paddingX = (sheetCanvas.width - (cols * targetWidth)) / (cols + 1);
    const paddingY = (sheetCanvas.height - (rows * targetHeight)) / (rows + 1);

    const dims = calculateDrawDimensions(processedImageBlob, targetWidth, targetHeight, zoom, offsetX, offsetY);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = paddingX + c * (targetWidth + paddingX);
            const y = paddingY + r * (targetHeight + paddingY);
            
            sheetCtx.fillStyle = currentBgColor;
            sheetCtx.fillRect(x, y, targetWidth, targetHeight);
            
            sheetCtx.save();
            sheetCtx.beginPath();
            sheetCtx.rect(x, y, targetWidth, targetHeight);
            sheetCtx.clip();
            
            sheetCtx.drawImage(processedImageBlob, x + dims.drawX, y + dims.drawY, dims.finalWidth, dims.finalHeight);
            sheetCtx.restore();
            
            sheetCtx.strokeStyle = '#cccccc';
            sheetCtx.lineWidth = 2; 
            sheetCtx.strokeRect(x, y, targetWidth, targetHeight);
        }
    }
    
    alert(`પ્રિન્ટ શીટ (${size}) તૈયાર છે! નીચે જુઓ.`);
});

// 5. Download PNG (Full HD Quality)
downloadBtn.addEventListener('click', () => {
    if (!sheetCanvas.width || sheetCanvas.width === 0) {
        alert("ડાઉનલોડ કરવા માટે પહેલા 'Generate Print Sheet' બટન પર ક્લિક કરો!");
        return;
    }
    const link = document.createElement('a');
    link.download = 'passport_print_sheet.png';
    link.href = sheetCanvas.toDataURL('image/png', 1.0); 
    link.click();
});

// 6. Print Function (High Resolution Window Print)
printBtn.addEventListener('click', () => {
    if (!sheetCanvas.width || sheetCanvas.width === 0) {
        alert("પ્રિન્ટ કરવા માટે પહેલા 'Generate Print Sheet' બટન પર ક્લિક કરો!");
        return;
    }
    const dataUrl = sheetCanvas.toDataURL('image/png', 1.0);
    
    const windowContent = '<!DOCTYPE html><html><head><title>Print Passport</title>' +
        '<style>@page { size: auto; margin: 0mm; } body { margin: 0; display: flex; justify-content: center; align-items: center; }</style>' +
        '</head><body>' + 
        '<img src="' + dataUrl + '" style="width: 100vw; height: 100vh; object-fit: contain;">' + 
        '</body></html>';
    
    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    printWindow.document.close();
    
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
});
