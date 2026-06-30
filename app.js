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
let originalImage = null;       // ઓરિજિનલ અપલોડ કરેલો ફોટો
let processedImageBlob = null;  // બેકગ્રાઉન્ડ રીમુવ થયા પછીનો ફોટો
let currentBgColor = '#ffffff'; // ડિફોલ્ટ વ્હાઇટ કલર
const passportWidth = 413;      // પાસપોર્ટ સાઈઝ પહોળાઈ
const passportHeight = 531;     // પાસપોર્ટ સાઈઝ ઊંચાઈ

// 1. Photo Upload Event
uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            originalImage = new Image();
            originalImage.onload = function() {
                processedImageBlob = originalImage; // શરૂઆતમાં ઓરિજિનલ ફોટો જ બતાવશે
                drawPassportPhoto();
            };
            originalImage.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 2. Real AI Background Removal (imgly library)
removeBgBtn.addEventListener('click', async () => {
    const file = uploadInput.files[0];
    if (!file) {
        alert("કૃપા કરીને પહેલા ફોટો અપલોડ કરો!");
        return;
    }
    
    // લોડિંગ સ્ક્રીન ચાલુ કરો
    loading.style.display = 'flex';
    
    try {
        // AI વડે બેકગ્રાઉન્ડ રીમુવ કરવાની પ્રોસેસ
        const blob = await imglyRemoveBackground(file);
        
        // રીમુવ થયેલા ફોટોને ઈમેજ ઓબ્જેક્ટમાં કન્વર્ટ કરો
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = function() {
            processedImageBlob = img; // હવે પ્રોસેસ થયેલો ફોટો સેવ થશે
            drawPassportPhoto();      // નવો ફોટો ડ્રો કરો
            loading.style.display = 'none'; // લોડિંગ બંધ
            alert("AI દ્વારા બેકગ્રાઉન્ડ સફળતાપૂર્વક રીમુવ થઈ ગયું છે!");
        };
        img.src = url;
    } catch (error) {
        console.error(error);
        loading.style.display = 'none';
        alert("બેકગ્રાઉન્ડ રીમુવ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી ટ્રાય કરો.");
    }
});

// 3. Background Color Selection
bgButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        bgButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentBgColor = e.target.getAttribute('data-color');
        
        if (processedImageBlob) {
            drawPassportPhoto(); // કલર બદલાતા જ ફોટો ફરી ડ્રો થશે
        }
    });
});

// પાસપોર્ટ ફોટો ડ્રો કરવાનું મેઈન ફંક્શન
function drawPassportPhoto() {
    if (!processedImageBlob) return;

    // કેનવાસ સાફ કરો
    ctx.clearRect(0, 0, passportWidth, passportHeight);

    // જે કલર સિલેક્ટ કર્યો હોય તે બેકગ્રાઉન્ડમાં ભરો (વ્હાઇટ કે બ્લુ)
    ctx.fillStyle = currentBgColor;
    ctx.fillRect(0, 0, passportWidth, passportHeight);

    // ઓટોમેટિક ફોટો સાઈઝ એડજસ્ટમેન્ટ લોજિક
    const imgRatio = processedImageBlob.width / processedImageBlob.height;
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

    // બેકગ્રાઉન્ડ કલરની ઉપર પર્સનનો ફોટો ડ્રો કરો
    ctx.drawImage(processedImageBlob, drawX, drawY, drawWidth, drawHeight);
}

// 4. Generate Print Sheet (Multiple Photos Layout)
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

// 5. Download PNG Function
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
