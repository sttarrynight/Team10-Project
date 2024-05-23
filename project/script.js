function openPopup(cafeName) {
    var popupText = document.getElementById('popup-text');
    popupText.innerHTML = cafeName + " 자세한 정보 제공";
    document.getElementById('popup').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popup').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    let observer = new IntersectionObserver(function (entries) {
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
});

function openLoginPopup(userType) {
    var popup = document.getElementById('login-popup');
    var popupContent = document.getElementById('login-popup-content');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'login2.html', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            popupContent.innerHTML = xhr.responseText;
            var popupText = document.getElementById('login-popup-text');
            if (popupText) {
                popupText.innerHTML = userType + " 로그인 페이지";
            }
            popup.style.display = 'flex';
            document.getElementById('login-role').value = userType.toLowerCase();
        }
    }
    xhr.send();
}

function openSignupPopup() {
    document.getElementById('signup-popup').style.display = 'block';
}

function closeSignupPopup() {
    document.getElementById('signup-popup').style.display = 'none';
}

function closeLoginPopup() {
    document.getElementById('login-popup').style.display = 'none';
}

function selectRole() {
    const roleForm = document.getElementById('role-selection-form');
    const signupForm = document.getElementById('signup-form');
    const phoneContainer = document.getElementById('phone-container');
    const selectedRole = document.querySelector('input[name="role"]:checked').value;

    roleForm.style.display = 'none';
    signupForm.style.display = 'block';

    if (selectedRole === 'manager') {
        phoneContainer.style.display = 'block';
    } else {
        phoneContainer.style.display = 'none';
    }
}

function submitSignupForm(event) {
    event.preventDefault();

    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const email = document.getElementById('email').value;
    const emailSelect = document.getElementById('mail_Select').value;
    const agree = document.getElementById('agree').checked;
    const role = document.querySelector('input[name="role"]:checked').value;
    const phone = role === 'manager' ? document.getElementById('phone').value : '';
    
    if (password !== confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
    }

    if (!agree) {
        alert('개인정보 수집 동의가 필요합니다.');
        return;
    }
    if (role === 'manager') {
        if (isNaN(phone) || phone.length !== 11) {
            alert('올바른 번호를 입력하세요.');
            return;
        }
    }

    const signupData = {
        username,
        password,
        email: `${email}@${emailSelect}`,
        role,
        phone
    };

    console.log('Sending signup data:', signupData);

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Signup response:', data);
        if (data.success) {
            alert('가입이 완료되었습니다.');
            closeSignupPopup();
        } else {
            alert('가입에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('login-role').value;

    console.log('Sending login data:', { username, password, role });

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, role })
    }).then(response => response.json())
        .then(data => {
            console.log('Login response:', data);
            if (data.success) {
                alert('로그인에 성공했습니다.');
                closeLoginPopup();
                document.getElementById('user-info').style.display = 'block';
                document.getElementById('welcome-message').textContent = `${username}님 환영합니다.`;
                document.getElementById('guest-manager-buttons').style.display = 'none';
            } else {
                alert('로그인에 실패했습니다.');
            }
        });
});
