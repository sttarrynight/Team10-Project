document.addEventListener('DOMContentLoaded', function () {
    addCafeIcons();
    generateGallery();

    let observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            } else {
                entry.target.classList.remove('show');
            }
        });
    }, {
        threshold: 0.1
    });

    const items = document.querySelectorAll('.image-container');
    items.forEach(item => observer.observe(item));

    // Add Cafe 버튼 클릭 이벤트 리스너 추가
    document.getElementById('add-cafe-button').addEventListener('click', openAddCafePopup);
});

function openAddCafePopup() {
    document.getElementById('add-cafe-popup').style.display = 'flex';
}

function closeAddCafePopup() {
    document.getElementById('add-cafe-popup').style.display = 'none';
}

function openPopup(cafeId) {
    const popupText = document.getElementsById('popup-text');
    popupText.innerHTML = cafeId + " 자세한 정보 제공";
    document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

//Add Cafe Data-form을 서버로 submit
function submitAddCafePopup() {
    document.getElementById('cafe-form').addEventListener('submit', function (event) {
        event.preventDefault();
    
        const form = document.getElementById('cafe-form');
        const formData = new FormData(form);
    
        fetch('http://localhost:3000/submit', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('카페 정보가 성공적으로 제출되었습니다.');
            closeAddCafePopup();
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('제출 중 오류가 발생했습니다.');
        });
    });
}

// 지도에 cafe 추가
const cafes = [
    { name: "Cafe 1", top: "10%", left: "28%", id: "cafe1" },
    { name: "Cafe 2", top: "16%", left: "34%", id: "cafe2" },
    { name: "Cafe 3", top: "23%", left: "38%", id: "cafe3" },
    { name: "Cafe 4", top: "33%", left: "20%", id: "cafe4" },
    { name: "Cafe 5", top: "27%", left: "33%", id: "cafe5" },
    { name: "Cafe 6", top: "32%", left: "28%", id: "cafe6" },
    { name: "Cafe 7", top: "60%", left: "35%", id: "cafe7" },
    { name: "Cafe 8", top: "40%", left: "44%", id: "cafe8" },
    { name: "Cafe 9", top: "48%", left: "46%", id: "cafe9" },
    { name: "Cafe 10", top: "21%", left: "49.55%", id: "cafe10" },
    { name: "Cafe 11", top: "27%", left: "47%", id: "cafe11" },
    { name: "Cafe 12", top: "31.5%", left: "49%", id: "cafe12" },
    { name: "Cafe 13", top: "43%", left: "54%", id: "cafe13" },
    { name: "Cafe 14", top: "31.5%", left: "54%", id: "cafe14" },
    { name: "Cafe 15", top: "36%", left: "55%", id: "cafe15" },
    { name: "Cafe 16", top: "38%", left: "50.5%", id: "cafe16" },
    { name: "Cafe 17", top: "21%", left: "44%", id: "cafe17" },
    { name: "Cafe 18", top: "26.5%", left: "53%", id: "cafe18" },
    { name: "Cafe 19", top: "71%", left: "54%", id: "cafe19" },
    { name: "Cafe 20", top: "67%", left: "59.5%", id: "cafe20" },
    { name: "Cafe 21", top: "74%", left: "64%", id: "cafe21" },
    { name: "Cafe 22", top: "66.5%", left: "67%", id: "cafe22" },
    { name: "Cafe 23", top: "51%", left: "75%", id: "cafe23" },
    { name: "Cafe 24", top: "53%", left: "65.5%", id: "cafe24" },
    { name: "Cafe 25", top: "44%", left: "73%", id: "cafe25" },
    { name: "Cafe 26", top: "56.5%", left: "78%", id: "cafe26" },
    { name: "Cafe 27", top: "56%", left: "51%", id: "cafe27" },
    { name: "Cafe 28", top: "61.5%", left: "54%", id: "cafe28" },
];

function scrollToGallery(cafeId) {
    const containers = document.querySelectorAll('.image-container');
    containers.forEach(container => container.classList.remove('selected'));

    var element = document.getElementById(cafeId);
    element.classList.add('selected');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function addCafeIcons() {
    const mapContainer = document.getElementById('map-container');
    cafes.forEach(cafe => {
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-mug-saucer coffee-icon';
        icon.style.top = cafe.top;
        icon.style.left = cafe.left;
        icon.setAttribute('onclick', `scrollToGallery('${cafe.id}');`);
        mapContainer.appendChild(icon);
    });
}

// 갤러리 동적 추가
function generateGallery() {
    const gallery = document.getElementById('gallery');
    for (let i = 1; i <= 28; i++) {
        const container = document.createElement('div');
        container.className = 'image-container';
        container.id = `cafe${i}`;

        const img = document.createElement('img');
        img.src = `altCafeImage.jpg`;
        img.alt = `Cafe ${i}`;
        img.onclick = function() {
            openPopup(`Cafe ${i}`);
        };

        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = `Cafe ${i}`;

        container.appendChild(img);
        container.appendChild(caption);
        gallery.appendChild(container);

        console.log(`Added cafe${i} with image source ${img.src}`);
    }
}

