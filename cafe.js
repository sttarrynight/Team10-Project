let allCafes = [];

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

    document.getElementById('open-cafes-button').addEventListener('click', function() {
        filterCafes('open');
        setActiveButton(this);
    });

    document.getElementById('few-outlets-button').addEventListener('click', function() {
        filterCafes('fewOutlets');
        setActiveButton(this);
    });

    document.getElementById('many-outlets-button').addEventListener('click', function() {
        filterCafes('manyOutlets');
        setActiveButton(this);
    });

    document.getElementById('study-friendly-button').addEventListener('click', function() {
        filterCafes('studyFriendly');
        setActiveButton(this);
    });

    //cafe-list에 옵션 추가
    cafeOption('add-cafe-list');
    cafeOption('delete-cafe-list');

    // Add & Delete Cafe 버튼 클릭 이벤트 리스너 추가
    document.getElementById('add-cafe-button').addEventListener('click', openAddCafePopup);
    document.getElementById('delete-cafe-button').addEventListener('click', openDeleteCafePopup);

    //카페 정보 입력 후 저장 버튼 클릭
    document.getElementById('cafe-add').addEventListener('click', addCafe);
    //카페 선택 후 Delete 버튼 클릭
    document.getElementById('cafe-delete').addEventListener('click', deleteCafe);

     // 사이드바 중복 가능
     let currentFilters = {
        americanoPrice: null,
        lattePrice: null,
        atmosphere: null
    };

    document.getElementById('filter-search-button').addEventListener('click', function() {
        applyFilters();
    });

    document.getElementById('price-range').addEventListener('change', function() {
        currentFilters.americanoPrice = this.value !== 'all' ? this.value : null;
    });

    document.getElementById('latte-price').addEventListener('change', function() {
        currentFilters.lattePrice = this.value !== 'all' ? this.value : null;
    });

    document.getElementById('ambiance').addEventListener('change', function() {
        currentFilters.atmosphere = this.value !== 'all' ? this.value : null;
    });

    document.getElementById('reset').addEventListener('click', function() {
        resetFilters();
        currentFilters = {
            americanoPrice: null,
            lattePrice: null,
            atmosphere: null
        };
    });

    fetch('http://localhost:3000/api/cafes')
    .then(response => response.json())
    .then(data => {
        allCafes = data; // 모든 카페 데이터 저장
    })
    .catch(error => console.error('Error fetching all cafes:', error));
    
    document.addEventListener('click', function(event) {
        const searchResults = document.querySelector('.search-results');
        const searchInput = document.querySelector('.search');
        const searchContainer = document.querySelector('.search-container');
        if (searchResults && !searchContainer.contains(event.target)) {
            searchResults.innerHTML = '';
            searchInput.value = ''; 
        }
    });

    // 검색 기능 추가
    document.querySelector('.search-button').addEventListener('click', function() {
        const searchTerm = document.querySelector('.search').value;
        if (searchTerm) {
            fetch(`http://localhost:3000/api/search?q=${searchTerm}`)
                .then(response => response.json())
                .then(data => {
                    displaySearchResults(data);
                    filterGallery(data);
                    filterCafeIcons(data);
                })
                .catch(error => console.error('Error searching cafes:', error));
        }
    });

    // 엔터키로도 검색 가능
    document.querySelector('.search').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            document.querySelector('.search-button').click();
        }
    });
});

// 팝업창 내부
function openPopup(cafeId) {
    console.log(`openPopup called with cafeId: ${cafeId}`);

    const cafe = allCafes.find(c => c.id.toLowerCase() === cafeId.toLowerCase());
    if (!cafe) {
        console.error(`Cafe with ID ${cafeId} not found`);
        return;
    }
    //console.log(`Cafe found: ${cafe.name}`);

    const popupText = document.getElementById('popup-text');
    popupText.innerHTML = `
        <div class="popup-main">
            <div class="popup-left">
                <img src="image/${cafeId}.jpg" alt="${cafe.name}" class="popup-image">
            </div>
            <div class="popup-right">
                <h2>${cafe.name}</h2>
                <p><strong>운영 시간:</strong></p>
                <ul>
                    ${Object.entries(cafe.operatingHours).map(([day, hours]) => `<li>${day}: ${hours}</li>`).join('')}
                </ul>
                <p><strong>콘센트:</strong> ${cafe.outlets}</p>
                <p><strong>아메리카노 가격:</strong> ${cafe.americanoPrice}원</p>
                <p><strong>카페라떼 가격:</strong> ${cafe.lattePrice}원</p>
                <p><strong>분위기:</strong></p>
                <ul>
                    ${Object.entries(cafe.atmosphere).filter(([key, value]) => value === 0).map(([key, value]) => `<li>${key}</li>`).join('')}
                </ul>
                <p><strong>추가 메뉴:</strong> ${cafe.additionalMenu1.name} - ${cafe.additionalMenu1.price}원</p>
                <p><strong>추가 메뉴2:</strong> ${cafe.additionalMenu2.name} - ${cafe.additionalMenu2.price}원</p>
                <p><strong>디저트:</strong> ${cafe.dessert1.name} - ${cafe.dessert1.price}원</p>
                <p><strong>디저트2:</strong> ${cafe.dessert2.name} - ${cafe.dessert2.price}원</p>
            
            </div>
        </div><br><br>
        <div class="popup-reviews">
            <h3>리뷰</h3>
            <div id="reviews-wrapper" class="reviews-wrapper">
                <button class="arrow left-arrow" onclick="scrollReviews(-1)">&#8249;</button>
                <div id="reviews-container" class="reviews-container"></div>
                <button class="arrow right-arrow" onclick="scrollReviews(1)">&#8250;</button>
            </div>
            <h3>리뷰 작성</h3>
            <form id="review-form" class="review-form">
                <input type="hidden" id="review-cafeId" value="${cafeId}">
                <input type="hidden" id="review-rating" value="0">
                <div class="review-inputs">
                    <div class="review-nickname-password">
                        <input type="text" id="review-nickname" placeholder="닉네임">
                        <input type="password" id="review-password" placeholder="비밀번호">
                    </div>
                    <textarea id="review-content" placeholder="리뷰 내용"></textarea>
                </div>
                <div class ="star_rating">
                    <span class="star on" value="1"> </span>
                    <span class="star" value="2"> </span>
                    <span class="star" value="3"> </span>
                    <span class="star" value="4"> </span>
                    <span class="star" value="5"> </span>
                </div>
                <div class="review-submit">
                    <button type="button" onclick="submitReview()">등록</button>
                </div>
            </form>
        </div>
    `;

    // 별점
    $('.star_rating > .star').click(function() {
        $(this).parent().children('span').removeClass('on');
        $(this).addClass('on').prevAll('span').addClass('on');
        $('#review-rating').val($(this).attr('value'));
    })   

    // 리뷰 표시
    fetchReviews(cafeId);
    document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

//Add & Delete Cafe Popup 이벤트 핸들링
function openAddCafePopup() {
    document.getElementById('add-cafe-popup').style.display = 'flex';
}

function closeAddCafePopup() {
    document.getElementById('add-cafe-popup').style.display = 'none';
}

function openDeleteCafePopup() {
    document.getElementById('delete-cafe-popup').style.display = 'flex';
}

function closeDeleteCafePopup() {
    document.getElementById('delete-cafe-popup').style.display = 'none';
}

// 지도에 cafe 추가
const cafes = [
    { name: "Cafe 1", top: "10%", left: "28%", id: "cafe1", isOpen: true },
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

//add, delete 리스트에 카페 옵션 추가
function cafeOption(buttonInfo) {
    cafes.forEach(cafe => {
        const cafeoption = document.createElement('option');
        cafeoption.value = cafe.id;
        cafeoption.innerText = cafe.name;
        document.getElementById(buttonInfo).appendChild(cafeoption);
    });
}

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
        icon.setAttribute('data-info', cafe.name);
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
        img.src = `image/cafe${i}.jpg`;
        img.alt = `Cafe ${i}`;
        img.onclick = function() {
            openPopup(`Cafe${i}`);
        };

        const caption = document.createElement('div');
        caption.className = 'caption';
        caption.textContent = `Cafe ${i}`;

        container.appendChild(img);
        container.appendChild(caption);
        gallery.appendChild(container);
    }
}

let showOnlyOpen = false;

function showOpenCafes() {
    const icons = document.querySelectorAll('.coffee-icon');
    if (showOnlyOpen) {
        icons.forEach(icon => icon.classList.remove('transparent'));
    } else {
        icons.forEach((icon, index) => {
            if (!cafes[index].isOpen) {
                icon.classList.add('transparent');
            }
        });
    }
    showOnlyOpen = !showOnlyOpen;
}

function setActiveButton(button) {
    const buttons = document.querySelectorAll('.icon-button, #price-range, #study-friendly-button, #ambiance, #reset');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (button) {
        button.classList.add('active');
    }
}

let activeFilter = null;

function filterCafes(type,  value = '') {
    if (activeFilter === type && value === '') {
        activeFilter = null;
        fetch('http://localhost:3000/api/cafes')
            .then(response => response.json())
            .then(data => {
                filterGallery(data);
                filterCafeIcons(data);
                setActiveButton(null);
            })
            .catch(error => console.error('Error fetching all cafes:', error));
        return;
    }

    activeFilter = type;

    let url = `http://localhost:3000/api/cafes?filter=${type}&value=${value}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            filterCafeIcons(data);
            filterGallery(data);
        })
        .catch(error => {
            console.error('Error fetching cafe data:', error);
        });
}

function filterCafeIcons(filteredCafes) {
    const mapContainer = document.getElementById('map-container');
    const allIcons = mapContainer.querySelectorAll('.coffee-icon');

    allIcons.forEach(icon => {
        const cafeId = icon.getAttribute('onclick').match(/'([^']+)'/)[1];
        if (filteredCafes.some(cafe => cafe.id === cafeId)) {
            icon.classList.remove('transparent');
        } else {
            icon.classList.add('transparent');
        }
    });
}

function filterGallery(filteredCafes) {
    const gallery = document.getElementById('gallery');
    const allContainers = gallery.getElementsByClassName('image-container');

    for (let container of allContainers) {
        container.style.display = 'none';
    }
    // 필터링된 카페들만 표시
    filteredCafes.forEach(cafe => {
        const container = document.getElementById(cafe.id);
        if (container) {
            container.style.display = 'block';
        }
    });

    console.log(`Filtered gallery updated with ${filteredCafes.length} cafes.`);
}

function resetFilters() {
    fetch('http://localhost:3000/api/cafes')
        .then(response => response.json())
        .then(data => {
            filterGallery(data);
            filterCafeIcons(data);
            document.getElementById('ambiance').value = 'all';
            document.getElementById('price-range').value = 'all';
            document.getElementById('latte-price').value = 'all';
            setActiveButton(null)
        })
        .catch(error => console.error('Error fetching all cafes:', error));
}


function displaySearchResults(data) {
    const resultsContainer = document.querySelector('.search-results');
    resultsContainer.innerHTML = '';
    data.forEach(cafe => {
        cafe.matchedMenus.forEach(menu => {
            const menuItem = document.createElement('div');
            menuItem.textContent = `${menu.name.replace(/"/g, '')}(${menu.price}원) - ${cafe.name.replace(/"/g, '')}`; // 따옴표 자꾸 떠서 제거
            menuItem.classList.add('search-result-item');
            menuItem.addEventListener('click', () => {
                filterCafeByMenu(cafe.id);
            });
            resultsContainer.appendChild(menuItem);
        });
    });
}

function filterCafeByMenu(cafeId) {
    const filteredCafes = allCafes.filter(cafe => cafe.id === cafeId);
    filterGallery(filteredCafes);
    filterCafeIcons(filteredCafes);
}

// 리뷰
function fetchReviews(cafeId) {
    fetch(`http://localhost:3000/api/reviews/${cafeId}`)
        .then(response => response.json())
        .then(reviews => {
            //console.log('Reviews:', reviews);
            const reviewsContainer = document.getElementById('reviews-container');
            reviewsContainer.innerHTML = reviews.map(review => `
                <div class="review">
                    <p><strong>${review.nickname}</strong></p>
                    <div class="star_rating">
                        ${[...Array(5)].map((_, i) => `<span class="star${i < review.rating ? ' on' : ''}"></span>`).join('')}
                    </div>
                    <p>${review.content}</p>
                    <br>
                    <button onclick="deleteReview('${review.id}')">삭제</button>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
        });
}

function submitReview() {
    const cafeId = document.getElementById('review-cafeId').value;
    const nickname = document.getElementById('review-nickname').value;
    const password = document.getElementById('review-password').value;
    const content = document.getElementById('review-content').value;
    const rating = parseInt(document.getElementById('review-rating').value, 10);

    fetch('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cafeId,
            nickname,
            password,
            content,
            rating
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(review => {
        console.log('Review added:', review);
        fetchReviews(cafeId);
    })
    .catch(error => {
        console.error('Error adding review:', error);
    });
}

// 리뷰 삭제 기능
function deleteReview(reviewId) {
    const password = prompt('비밀번호를 입력하세요:');
    if (!password) {
        return;
    }

    fetch(`http://localhost:3000/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error deleting review');
            });
        }
        return response.json();
    })
    .then(() => {
        console.log('Review deleted');
        const cafeId = document.getElementById('review-cafeId').value;
        fetchReviews(cafeId);
    })
    .catch(error => {
        console.error('Error deleting review:', error);
        alert(`리뷰 삭제에 실패했습니다: ${error.message}`);
    });
}

// 리뷰 스크롤
function scrollReviews(direction) {
    const container = document.getElementById('reviews-container');
    const scrollAmount = 300;

    if (direction === 1) {
        container.scrollLeft += scrollAmount;
    } else {
        container.scrollLeft -= scrollAmount;
    }
}

// 사이드바 중복
function applyFilters() {
    const americanoPrice = document.getElementById('price-range').value;
    const lattePrice = document.getElementById('latte-price').value;
    const ambiance = document.getElementById('ambiance').value;

    let filters = {
        americanoPrice: americanoPrice !== 'all' ? americanoPrice : null,
        lattePrice: lattePrice !== 'all' ? lattePrice : null,
        atmosphere: ambiance !== 'all' ? ambiance : null
    };

    fetch(`http://localhost:3000/api/cafes/filters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
    })
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            alert('해당되는 카페가 없습니다.');
            resetFilters(); 
        } else {
            filterGallery(data);
            filterCafeIcons(data);
        }
    })
    .catch(error => console.error('Error applying filters:', error));
}

//카페 정보 저장
function addCafe() {
    document.getElementById('add-cafe-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const form = document.getElementById('add-cafe-form');
        const formData = new FormData(form);
    
        fetch('/submit-save',{
            method: 'POST',
            body: formData
        }).then(response => response.text())
        .then(data => {
            alert('데이터가 저장되었습니다.');
            closeAddCafePopup();
            location.reload();
            console.log(data);
        }).catch(error => {
            console.error('Error:', error);
        });
    });
}

//카페 정보 삭제
function deleteCafe() {
    document.getElementById('delete-cafe-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const form = document.getElementById('delete-cafe-form');
        //file 형식이 포함되지 않았기 때문에, url형식으로 데이터 전송
        const formData = new URLSearchParams(new FormData(form)).toString();

        fetch('/submit-delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            alert('카페 정보가 삭제되었습니다.');
            closeDeleteCafePopup();
            location.reload();
            console.log(data);
        }).catch(error => {
            console.error('Error', error);
        });
    });
}