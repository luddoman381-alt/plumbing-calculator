// ======================================
// НАСТРОЙКА N8N
// ======================================


const N8N_WEBHOOK_URL =
    "https://studied-can-loading-henderson.trycloudflare.com/webhook/plumbing-lead";


// ======================================
// ЦЕНЫ
// ======================================

const prices = {
    toilet: 15000,
    sink: 12000,
    shower: 20000,
    bath: 25000,
    washing: 10000,
    boiler: 25000,

    waterPipes: 80000,
    sewerage: 60000,
    collector: 35000,
    filters: 20000,

    demolition: 15000,
    installation: 30000,
    mixer: 8000
};


// ======================================
// НАЗВАНИЯ РАБОТ
// ======================================

const serviceNames = {
    toilet: "Установка унитаза",
    sink: "Установка раковины",
    shower: "Установка душевой кабины",
    bath: "Установка ванны",
    washing: "Подключение стиральной машины",
    boiler: "Установка бойлера",

    waterPipes: "Монтаж водопровода",
    sewerage: "Монтаж канализации",
    collector: "Монтаж коллектора",
    filters: "Установка фильтров",

    demolition: "Демонтаж старой сантехники",
    installation: "Монтаж сантехники",
    mixer: "Установка смесителя"
};


// ======================================
// ПОЛУЧЕНИЕ РАСЧЁТА
// ======================================

function calculateTotal() {

    const area = Number(
        document.getElementById("area").value
    );

    if (!Number.isFinite(area) || area <= 0) {
        return null;
    }

    let total = 0;
    const services = [];

    Object.keys(serviceNames).forEach(function (key) {

        let elementId = key;

        // IDs некоторых чекбоксов отличаются от названия
        if (key === "waterPipes") {
            elementId = "water-pipes";
        }

        if (key === "sewerage") {
            elementId = "sewerage";
        }

        const element = document.getElementById(elementId);

        if (element && element.checked) {

            total += prices[key];

            services.push(serviceNames[key]);
        }
    });


    // ======================================
    // ТИП ОБЪЕКТА
    // ======================================

    const objectElement =
        document.querySelector(
            'input[name="object"]:checked'
        );

    const objectType =
        objectElement ? objectElement.value : "apartment";

    let objectName = "Квартира";

    if (objectType === "house") {
        objectName = "Частный дом";
        total *= 1.15;
    }

    if (objectType === "commercial") {
        objectName = "Коммерческое помещение";
        total *= 1.25;
    }


    // ======================================
    // КОЭФФИЦИЕНТ ПО ПЛОЩАДИ
    // ======================================

    if (area > 200) {
        total *= 1.20;
    } else if (area > 100) {
        total *= 1.10;
    }


    // Округляем до 1000 ₸
    total = Math.round(total / 1000) * 1000;


    return {
        area: area,
        objectType: objectType,
        objectName: objectName,
        services: services,
        total: total
    };
}


// ======================================
// КНОПКА "РАССЧИТАТЬ"
// ======================================

const calculateButton =
    document.getElementById("calculate");

if (calculateButton) {

    calculateButton.addEventListener(
        "click",
        function () {

            const calculation = calculateTotal();

            if (!calculation) {

                alert("Введите площадь помещения");

                document
                    .getElementById("area")
                    .focus();

                return;
            }


            if (calculation.services.length === 0) {

                alert(
                    "Выберите хотя бы одну сантехническую работу"
                );

                return;
            }


            const result =
                document.getElementById("result");


            result.innerHTML = `
                <span>Предварительная стоимость</span>

                <strong>
                    ${calculation.total.toLocaleString("ru-RU")} ₸
                </strong>

                <small>
                    Ориентировочная стоимость работ.
                    Точная цена определяется после осмотра объекта.
                </small>
            `;


            result.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }
    );
}


// ======================================
// ОТПРАВКА ЗАЯВКИ В N8N
// ======================================

const contactForm =
    document.getElementById("contactForm");


if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // Получаем данные клиента

            const name =
                document.getElementById("name").value.trim();

            const phone =
                document.getElementById("phone").value.trim();

            const city =
                document.getElementById("city").value.trim();


            // Проверяем данные

            if (!name) {
                alert("Введите ваше имя");
                return;
            }

            if (!phone) {
                alert("Введите номер телефона");
                return;
            }

            if (!city) {
                alert("Введите город");
                return;
            }


            // Получаем расчёт

            const calculation = calculateTotal();


            if (!calculation) {

                alert("Сначала укажите площадь помещения");

                document
                    .getElementById("area")
                    .focus();

                return;
            }


            if (calculation.services.length === 0) {

                alert(
                    "Выберите хотя бы одну сантехническую работу"
                );

                return;
            }


            // ======================================
            // ДАННЫЕ ДЛЯ N8N
            // ======================================

            const lead = {

                name: name,

                phone: phone,

                city: city,

                area: calculation.area,

                objectType: calculation.objectName,

                services: calculation.services,

                total: calculation.total

            };


            // ======================================
            // ОТПРАВКА
            // ======================================

            try {

                const response =
                    await fetch(
                        N8N_WEBHOOK_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(lead)
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        "Ошибка сервера: " +
                        response.status
                    );

                }


                // ======================================
                // УСПЕШНО
                // ======================================

                const success =
                    document.getElementById(
                        "formSuccess"
                    );


                if (success) {

                    success.textContent =
                        "✓ Заявка успешно отправлена! Мы свяжемся с вами.";

                    success.style.display = "block";

                } else {

                    alert(
                        "Заявка успешно отправлена!"
                    );

                }


                // Очищаем форму

                contactForm.reset();


            } catch (error) {

                console.error(
                    "Ошибка отправки:",
                    error
                );


                alert(
                    "Не удалось отправить заявку. Проверьте, запущен ли n8n."
                );

            }

        }
    );
}
