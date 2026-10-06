import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyBUU4gSf5jpHjyMg3r1AK3D-_aNbhdJrzY",
  authDomain: "suqna-4302c.firebaseapp.com",
  projectId: "suqna-4302c",
  storageBucket: "suqna-4302c.firebasestorage.app",
  messagingSenderId: "296413210782",
  appId: "1:296413210782:web:1e30b027b0a4ff5e3a338f",
  measurementId: "G-XY6DN2LZFC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let allProducts = []; // لتخزين المنتجات محلياً للبحث السريع
let currentCategory = 'الكل';

// التنقل بين الصفحات
window.navigate = function(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if(pageId === 'home') {
        window.loadProducts();
    }
}

// الوضع الليلي والنهاري
const themeToggle = document.getElementById('themeToggle');
if(themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// مراقبة حساب المستخدم
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('btnLogin').style.display = 'none';
        document.getElementById('btnLogout').style.display = 'inline-block';
        document.getElementById('btnAddItem').style.display = 'inline-block';
    } else {
        document.getElementById('btnLogin').style.display = 'inline-block';
        document.getElementById('btnLogout').style.display = 'none';
        document.getElementById('btnAddItem').style.display = 'none';
    }
});

// تسجيل حساب
window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert("يرجى إدخال البريد وكلمة المرور");
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => { alert("تم إنشاء الحساب بنجاح! 🎉"); navigate('home'); })
        .catch(error => alert("خطأ: " + error.message));
}

// تسجيل الدخول
window.login = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert("يرجى إدخال البريد وكلمة المرور");
    signInWithEmailAndPassword(auth, email, password)
        .then(() => { alert("تم تسجيل الدخول بنجاح! 🚀"); navigate('home'); })
        .catch(error => alert("تأكد من صحة البيانات المدخلة"));
}

// تسجيل الخروج
window.logout = function() {
    signOut(auth).then(() => { alert("تم تسجيل الخروج 👋"); navigate('home'); });
}

// إضافة منتج جديد
window.addProduct = async function() {
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const region = document.getElementById('region').value;
    const desc = document.getElementById('description').value;
    const price = document.getElementById('price').value;
    const phone = document.getElementById('phone').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const file = document.getElementById('image').files[0];

    if(!title || !price || !phone) return alert("⚠️ يرجى ملء الحقول الأساسية (الاسم، السعر، ورقم الهاتف)");
    if(!file) return alert("📸 يرجى إرفاق صورة للمنتج");

    const addBtn = document.querySelector('.add-btn-large');
    addBtn.innerText = "جاري النشر... ⏳";
    addBtn.disabled = true;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageBase64 = e.target.result;
        try {
            await addDoc(collection(db, "products"), {
                title, category, region, description: desc, price, phone, whatsapp,
                image: imageBase64, userId: auth.currentUser.uid, timestamp: new Date()
            });
            alert("تم نشر إعلانك بنجاح! ✅");
            
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            document.getElementById('price').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('whatsapp').value = '';
            document.getElementById('image').value = '';

            addBtn.innerText = "انشر الإعلان الآن ✅";
            addBtn.disabled = false;
            
            window.loadProducts();
            navigate('home');
        } catch (e) {
            console.error(e);
            alert("حدث خطأ أثناء الرفع.");
            addBtn.innerText = "انشر الإعلان الآن ✅";
            addBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

// جلب المنتجات من القاعدة
window.loadProducts = async function() {
    const productsList = document.getElementById('productsList');
    if(!productsList) return;
    
    productsList.innerHTML = '<h3 style="text-align:center; width: 100%; grid-column: 1 / -1;">جاري تحميل الإعلانات... ⏳</h3>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        allProducts = [];
        querySnapshot.forEach((doc) => {
            allProducts.push(doc.data());
        });
        displayProducts(allProducts);
    } catch(e) {
         console.error(e);
         productsList.innerHTML = '<p style="text-align:center; color:red; width: 100%; grid-column: 1 / -1;">خطأ في جلب البيانات.</p>';
    }
}

// فلترة حسب القسم عبر الشريط الجانبي
window.filterByCategory = function(category) {
    currentCategory = category;
    
    // تحديث شكل الأقسام في القائمة الجانبية
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active-cat'));
    event && event.target.classList.add('active-cat');
    
    document.getElementById('categoryTitle').innerText = category === 'الكل' ? '🔥 أحدث الإعلانات' : `📁 إعلانات قسم: ${category}`;
    searchProducts();
}

// وظيفة البحث الذكي والفلترة حسب المنطقة والقسم
window.searchProducts = function() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const selectedRegion = document.getElementById('regionFilter').value;

    const filtered = allProducts.filter(item => {
        const matchesCategory = (currentCategory === 'الكل' || item.category === currentCategory);
        const matchesRegion = (!selectedRegion || item.region === selectedRegion);
        const matchesSearch = item.title.toLowerCase().includes(searchText) || (item.description && item.description.toLowerCase().includes(searchText));
        
        return matchesCategory && matchesRegion && matchesSearch;
    });

    displayProducts(filtered);
}

// عرض المنتجات في الشاشة
function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';
    
    if(products.length === 0) {
        productsList.innerHTML = '<h3 style="text-align:center; width: 100%; grid-column: 1 / -1;">لا توجد إعلانات مطابقة لبحثك. 🔍</h3>';
        return;
    }

    products.forEach((data) => {
        let whatsappButton = '';
        if(data.whatsapp) {
            whatsappButton = `<a href="https://wa.me/${data.whatsapp}" target="_blank" class="contact-btn whatsapp-btn">💬 واتساب</a>`;
        }

        productsList.innerHTML += `
            <div class="product-card">
                <img src="${data.image}" alt="${data.title}">
                <div class="product-info">
                    <span class="product-category-tag">${data.category || 'عام'}</span>
                    <span class="product-region-tag">📍 ${data.region || 'غير محدد'}</span>
                    <h3>${data.title}</h3>
                    <p class="product-description">${data.description || ''}</p>
                    <div class="product-price">${data.price} ج.م</div>
                    <div class="card-actions">
                        <a href="tel:${data.phone}" class="contact-btn">📞 اتصال</a>
                        ${whatsappButton}
                    </div>
                </div>
            </div>
        `;
    });
}

window.onload = window.loadProducts;
