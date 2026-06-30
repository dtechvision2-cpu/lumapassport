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

// Global Variables
let originalImage = null;
let currentBgColor = '#ffffff'; // Default white
const passportWidth = 413;  // ~35mm in px (at 300 DPI)
const passportHeight = 531; // ~45mm in px (at 300 DPI)

// 1. Photo Upload Event
uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                drawPassportPhoto();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 2. Simulated AI Background Removal
removeBgBtn.addEventListener('click', () => {
    if (!originalImage) {
        alert("કૃપા કરીને પહેલા ફોટો અપલોડ કરો!");
        return;
    }
    
    // Show AI loader
    loading.style.display = 'flex';
    
    setTimeout(() => {
        loading.style.display = 'none';
        drawPassportPhoto();
        alert("AI દ્વારા બેકગ્રાઉન્ડ સફળતાપૂર્વક સેટ થઈ ગયું છે!");
    }, 2000); // 2 seconds fake loading
});

// 3. Background Color Selection
bgButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        bgButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentBgColor = e.target.getAttribute('data-color');
        
        if (originalImage) {
            drawPassportPhoto();
        }
    });
});

// Function to draw Passport Photo with Auto-Adjustment
function drawPassportPhoto() {
    if (!originalImage) return;

    // Clear Canvas
    ctx.clearRect(0, 0, passportWidth, passportHeight);

    // Fill Selected Background Color
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, passportWidth, passportHeight);

    // Auto Adjust / Center Crop Logic (Aspect Ratio Maintain)
    const imgRatio = originalImage.width / originalImage.height;
    const canvasRatio = passportWidth / passportHeight;
    
    let drawWidth, drawHeight, drawX, drawY;

    if (imgRatio > canvasRatio) {
        drawHeight = passportHeight;
        drawWidth = passportHeight * imgRatio;
        drawX = (passportWidth - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = passportWidth;
        drawHeight = passportWidth / imgRatio;
        drawX = 0;
        drawY = (passportHeight - drawHeight) / 2;
    }

    // Draw Image
    ctx.drawImage(originalImage, drawX, drawY, drawWidth, drawHeight);
}

// 4. Generate Print Sheet (Multiple Photos Layout)
generateSheetBtn.addEventListener('click', () => {
    if (!originalImage) {
        alert("કૃપા કરીને પહેલા પાસપોર્ટ ફોટો તૈયાર કરો!");
        return;
    }

    const size = sheetSizeSelect.value;
    let cols = 0, rows = 0;

    // Set Sheet Size Resolutions (Standard Printing Formats)
    if (size === '4x6') {
        sheetCanvas.width = 1200;
        sheetCanvas.height = 1800;
        cols = 2; rows = 3; // Total 6 Photos
    } else if (size === '5x7') {
        sheetCanvas.width = 1500;
        sheetCanvas.height = 2100;
        cols = 3; rows = 3; // Total 9 Photos
    } else if (size === 'A4') {
        sheetCanvas.width = 2480;
        sheetCanvas.height = 3508;
        cols = 5; rows = 6; // Total 30 Photos
    }

    // Clean sheet canvas
    sheetCtx.fillStyle = '#ffffff';
    sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

    // Calculate Spacing
    const paddingX = (sheetCanvas.width - (cols * passportWidth)) / (cols + 1);
    const paddingY = (sheetCanvas.height - (rows * passportHeight)) / (rows + 1);

    // Grid Layout drawing
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = paddingX + c * (passportWidth + paddingX);
            const y = paddingY + r * (passportHeight + paddingY);
            
            // Draw passport photo onto sheet
            sheetCtx.drawImage(canvas, x, y, passportWidth, passportHeight);
            
            // Optional: Light border around each photo for cutting guide
            sheetCtx.strokeStyle = '#cccccc';
            sheetCtx.lineWidth = 2;
            sheetCtx.strokeRect(x, y, passportWidth, passportHeight);
        }
    }
    
    alert(`પ્રિન્ટ શીટ (${size}) તૈયાર છે! નીચે જુઓ.`);
});

// 5. Download PNG Function
downloadBtn.addEventListener('click', () => {
    if (!originalImage) {
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
    if (!originalImage) {
        alert("પ્રિન્ટ કરવા માટે કોઈ શીટ જનરેટ થયેલ નથી!");
        return;
    }
    const dataUrl = sheetCanvas.toDataURL();
    const windowContent = '<!DOCTYPE html><html><head><title>Print Passport</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center;">' + '<img src="' + dataUrl + '" style="max-width:100%; height:auto;">' + '</body></html>';
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    
    // Wait until image is loaded in new window, then print
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
});
