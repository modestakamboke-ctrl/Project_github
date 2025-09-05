document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Image upload preview for encoding
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Image upload preview for decoding
    const encodedImageUpload = document.getElementById('encoded-image-upload');
    const encodedImagePreview = document.getElementById('encoded-image-preview');
    
    encodedImageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                encodedImagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Encode message into image
    const encodeBtn = document.getElementById('encode-btn');
    const downloadLink = document.getElementById('download-link');
    
    encodeBtn.addEventListener('click', function() {
        const imageFile = imageUpload.files[0];
        const message = document.getElementById('secret-message').value;
        const encryptionKey = document.getElementById('encryption-key').value;
        
        if (!imageFile) {
            alert('Please select an image first');
            return;
        }
        
        if (!message) {
            alert('Please enter a message to encode');
            return;
        }
        
        // Process the image and message
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Create canvas to work with the image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Encrypt message if key is provided
                let processedMessage = message;
                if (encryptionKey) {
                    processedMessage = simpleEncrypt(message, encryptionKey);
                }
                
                // Add end marker
                processedMessage += '[END]';
                
                // Convert message to binary
                const binaryMessage = textToBinary(processedMessage);
                const messageLength = binaryMessage.length;
                
                // Check if message fits in image
                if (32 + (messageLength * 8) > data.length * 3) {
                    alert('Message is too large for the selected image');
                    return;
                }
                
                // First encode message length (32 bits)
                for (let i = 0; i < 32; i++) {
                    const bit = (messageLength >> (31 - i)) & 1;
                    const pixelIndex = Math.floor(i / 3);
                    const channelIndex = i % 3;
                    const dataIndex = pixelIndex * 4 + channelIndex;
                    
                    if (dataIndex < data.length) {
                        data[dataIndex] = (data[dataIndex] & 0xFE) | bit;
                    }
                }
                
                // Then encode the actual message
                for (let i = 0; i < binaryMessage.length; i++) {
                    const charCode = binaryMessage.charCodeAt(i);
                    for (let j = 0; j < 8; j++) {
                        const bit = (charCode >> (7 - j)) & 1;
                        const dataIndex = 32 + (i * 8) + j;
                        
                        const pixelIndex = Math.floor(dataIndex / 3);
                        const channelIndex = dataIndex % 3;
                        const finalIndex = pixelIndex * 4 + channelIndex;
                        
                        if (finalIndex < data.length) {
                            data[finalIndex] = (data[finalIndex] & 0xFE) | bit;
                        }
                    }
                }
                
                // Put the modified data back
                ctx.putImageData(imageData, 0, 0);
                
                // Create download link
                const encodedImage = canvas.toDataURL('image/png');
                downloadLink.href = encodedImage;
                downloadLink.download = 'encoded_image.png';
                downloadLink.classList.remove('hidden');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
    });
    
    // Decode message from image
    const decodeBtn = document.getElementById('decode-btn');
    
    decodeBtn.addEventListener('click', function() {
        const imageFile = encodedImageUpload.files[0];
        const decryptionKey = document.getElementById('decryption-key').value;
        
        if (!imageFile) {
            alert('Please select an encoded image first');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Create canvas to work with the image
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // First extract message length (first 32 bits)
                let messageLength = 0;
                for (let i = 0; i < 32; i++) {
                    const pixelIndex = Math.floor(i / 3);
                    const channelIndex = i % 3;
                    const dataIndex = pixelIndex * 4 + channelIndex;
                    
                    if (dataIndex >= data.length) break;
                    
                    const bit = data[dataIndex] & 1;
                    messageLength = (messageLength << 1) | bit;
                }
                
                if (messageLength <= 0 || messageLength > (data.length - 32) / 8) {
                    alert('No valid encoded message found or image is corrupted');
                    return;
                }
                
                // Now extract the actual message
                let binaryMessage = '';
                let messageEnd = false;
                
                for (let i = 0; i < messageLength; i++) {
                    let charCode = 0;
                    for (let j = 0; j < 8; j++) {
                        const dataIndex = 32 + (i * 8) + j;
                        const pixelIndex = Math.floor(dataIndex / 3);
                        const channelIndex = dataIndex % 3;
                        const finalIndex = pixelIndex * 4 + channelIndex;
                        
                        if (finalIndex >= data.length) break;
                        
                        const bit = data[finalIndex] & 1;
                        charCode = (charCode << 1) | bit;
                    }
                    binaryMessage += String.fromCharCode(charCode);
                    
                    // Check for end marker
                    if (binaryMessage.includes('[END]')) {
                        messageEnd = true;
                        binaryMessage = binaryMessage.split('[END]')[0];
                        break;
                    }
                }
                
                if (!messageEnd) {
                    alert('No encoded message found or message is corrupted');
                    return;
                }
                
                // Convert binary to text
                let decodedMessage = binaryToText(binaryMessage);
                
                // Decrypt if key was used
                if (decryptionKey) {
                    decodedMessage = simpleDecrypt(decodedMessage, decryptionKey);
                }
                
                // Display decoded message
                document.getElementById('decoded-message').value = decodedMessage;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(imageFile);
    });
    
    // Helper functions
    function textToBinary(text) {
        let binary = '';
        for (let i = 0; i < text.length; i++) {
            binary += String.fromCharCode(text.charCodeAt(i));
        }
        return binary;
    }
    
    function binaryToText(binary) {
        let text = '';
        for (let i = 0; i < binary.length; i++) {
            text += String.fromCharCode(binary.charCodeAt(i));
        }
        return text;
    }
    
    function simpleEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    }
    
    function simpleDecrypt(text, key) {
        // XOR encryption is symmetric (same as encryption)
        return simpleEncrypt(text, key);
    }
});