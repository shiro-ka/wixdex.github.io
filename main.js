// タッチ開始時のY座標初期値を設定
let touchStartY = 0;
// Life Burstボタンの状態
let lifeBurstState = 0;
// 現在のカードを記録する変数
let currentCard;

// DOM読込完了時に実行
document.addEventListener('DOMContentLoaded', () => {

    // cards.jsonを取得
    fetch('cards.json')
        .then(response => response.json())
        .then(responseData => {
            window.cardsData = responseData;
            displayCards(responseData);

            // 初回読込時にステータス欄を更新
            updateDeckStatus();
        })

        .catch(error => console.error('カードデータが読み込めなかったっぽい！', error));

    // テキスト入力の検索イベントリスナー
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', handleSearch);

    // カードタイプのプルダウン選択
    const searchTypeInput = document.getElementById('search-type-input');
    searchTypeInput.addEventListener('change', handleSearch);

    // レベル選択ボタンの処理
    const levelButtons = document.querySelectorAll('.level-button');
    const selectedLevels = new Set();  // 選択されたレベルを管理

    levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            const level = button.dataset.level;

            // ボタンのオン・オフを切り替え
            if (selectedLevels.has(level)) {
                selectedLevels.delete(level);
                button.classList.remove('active');  // オフ状態のスタイル
            } else {
                selectedLevels.add(level);
                button.classList.add('active');  // オン状態のスタイル
            }

            // 検索を実行
            handleSearch();
        });
    });

    // LBボタンのクリックイベント
    const lifeBurstButton = document.getElementById('life-burst-toggle');
    let lifeBurstState = 0; // 0: どっちも, 1: LBあり, 2: LBなし

    // Life Burst ボタンのクリックイベントリスナー
    lifeBurstButton.addEventListener('click', function() {
        // クリックごとにlifeBurstStateを更新（0→1→2→0のループ）
        lifeBurstState = (lifeBurstState + 1) % 3;

        // 状態に応じてボタンの背景色を変更
        switch (lifeBurstState) {
            case 0: // どっちも
                this.style.backgroundColor = "";  // デフォルトの色に戻す
                console.log("LBどっちもで検索");
                break;
            case 1: // LBあり
                this.style.backgroundColor = "green";  // LBありの色
                console.log("LBアリで検索");
                break;
            case 2: // LBなし
                this.style.backgroundColor = "red";  // LBなしの色
                console.log("LBナシで検索");
                break;
        }

        // 検索を実行
        handleSearch(); // 状態変更後、必ず検索を再実行
    });

});

// ステータス欄を更新
function updateDeckStatus() {
    // メインデッキ要素を取得
     const mainDeck = document.getElementById('main-deck-cards');

    // メインデッキ内のlifeBurstのカウント
    let lifeBurstCount = 0;

    // メインデッキ内の各カードをチェック
    Array.from(mainDeck.children).forEach(cardElement => {
        const cardName = cardElement.querySelector('p').textContent;
        const cardData = window.cardsData.find(card => card.name === cardName);
        if (cardData && cardData.lifeBurst === 1) {
            lifeBurstCount++;
        }
    });

    // LB枚数を表示
    document.getElementById('life-burst-count').textContent = `${lifeBurstCount}`;
}

// カードを検索
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedType = document.getElementById('search-type-input').value;
    const cardsContainer = document.getElementById('cards-container');
    const selectedLevels = Array.from(document.querySelectorAll('.level-button.active')).map(button => button.dataset.level);

    cardsContainer.innerHTML = '';

    let filteredCards = window.cardsData.filter(card => {
        const nameMatch = card.name.toLowerCase().includes(searchTerm);
        const subnameMatch = card.subname && card.subname.some(sub => sub.toLowerCase().includes(searchTerm));
        const typeMatch = selectedType === "" || card.type.includes(selectedType);
        const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(card.level.toString());
        const lifeBurstMatch = (
            lifeBurstState === 0 ||  // どっちも
            (lifeBurstState === 1 && card.lifeBurstcard.level === 1) ||  // LBあり
            (lifeBurstState === 2 && card.lifeBurstcard.level === 0)     // LBなし
        );

        return (nameMatch || subnameMatch) && typeMatch && levelMatch && lifeBurstMatch;
    });

    displayCards(filteredCards);
}

// displayCards関数
function displayCards(cards) {

    const cardsContainer = document.getElementById('cards-container');
    cards.forEach(card => {

        // cards-containerに追加する<div class="card">を作成
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');

        // URLからカード画像を設定
        const cardImage = document.createElement('img');
        cardImage.src = card.image;
        // 画像が表示できなかった場合はカード名を表示
        cardImage.alt = card.name;

        // カードをcards-containerに表示
        cardElement.appendChild(cardImage);
        cardsContainer.appendChild(cardElement);

        // カードにフリックのリスナーを追加
        cardElement.addEventListener('touchstart', handleTouchStart);
        cardElement.addEventListener('touchend', (event) => {
            // 現在のカードを記録
            currentCard = card; 
            handleTouchEnd(event);
        });
    });
}

// リスト欄のフリックリスナー
function handleTouchStart(event) {
    // タッチ開始時のY座標を保存
    touchStartY = event.touches[0].clientY;
}

// リスト欄のカード上下フリックでデッキに追加
function handleTouchEnd(event) {

    // タッチ終了時のY座標を取得し、フリックの距離を計算
    const touchEndY = event.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;

    // 上方向にフリックされた場合、addCardToDeck関数を1回処理
    if (swipeDistance > 50 && currentCard) {
        addCardToDeck(currentCard);
    } 
    // 下方向にフリックされた場合、addCardToDeck関数を4回処理
    else if (swipeDistance < -50 && currentCard) {
        for (let i = 0; i < 4; i++) {
            addCardToDeck(currentCard);
        }
    }

    // ステータス欄を更新
    updateDeckStatus();
}

// デッキにカードを追加
function addCardToDeck(card) {

    // lrig-deck-cardsとmain-deck-cardsをjsで取得
    const lrigDeck = document.getElementById('lrig-deck-cards');
    const mainDeck = document.getElementById('main-deck-cards');

    // deckに追加する<div class="card">を作成
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');

    // URLからカード画像を設定
    const cardImage = document.createElement('img');
    cardImage.src = card.image;
    cardImage.alt = card.name;

    // カード名を表示する<p>要素を作成
    const cardName = document.createElement('p');
    cardName.textContent = card.name;

    // dataset にカードの種類とレベルを追加
    cardElement.dataset.type = card.type[0];
    cardElement.dataset.level = card.level;

    // cardElementに画像と名前を追加
    cardElement.appendChild(cardImage);
    cardElement.appendChild(cardName);

    // カード種類の最初の要素を取得
    const cardType = card.type[0];

    // ルリグデッキに追加
    if (['ルリグ', 'アシストルリグ', 'ピース', 'アーツ'].includes(cardType)) {
        if (lrigDeck.children.length >= 8) {
            console.log(`Cannot add ${card.name} to Lrig Deck: Deck is full`);
            return;
        }
        lrigDeck.appendChild(cardElement);
        console.log(`Added ${card.name} to Lrig Deck`);
        sortLrigDeck();

    // メインデッキに追加
    } else if (['シグニ', 'スペル', 'サーバント'].includes(cardType)) {

        // デッキ枚数は40枚まで
        if (mainDeck.children.length >= 40) {
            console.log(`Cannot add ${card.name} to Main Deck: Deck is full`);
            return;
        }

        // デッキ内の同名カードの数を確認
        const sameNameCards = Array.from(mainDeck.children).filter(deckCard => {
            const deckCardName = deckCard.querySelector('p').textContent;
            return deckCardName === card.name;
        });

        // 同名カードは4枚まで
        if (sameNameCards.length >= 4) {
            console.log(`Cannot add ${card.name} to Main Deck: More than 4 copies`);
            return;
        }

        mainDeck.appendChild(cardElement);
        console.log(`Added ${card.name} to Main Deck`);
        sortMainDeck();

    }

    // カードにフリックイベントを追加
    cardElement.addEventListener('touchstart', handleTouchStart);
    cardElement.addEventListener('touchend', handleRemoveTouchEnd);
    cardElement.addEventListener('touchend', handleDuplicateTouchEnd);

    // ステータス欄を更新
    updateDeckStatus();
}

// デッキ欄のカード上フリックでさらに追加
function handleDuplicateTouchEnd(event) {

    // タッチ終了時のY座標を取得し、フリックの距離を計算
    const touchEndY = event.changedTouches[0].clientY;
    const swipeDistance = touchStartY - touchEndY;

    // 上方向にスワイプされた場合、カードを複製
    if (swipeDistance > 50 && event.currentTarget) {
        duplicateCard(event.currentTarget);
    }
}

// 追加の関数
function duplicateCard(cardElement) {

    const lrigDeck = document.getElementById('lrig-deck-cards');
    const mainDeck = document.getElementById('main-deck-cards');

    const cardName = cardElement.querySelector('p').textContent;
    const cardData = window.cardsData.find(card => card.name === cardName);

    if (!cardData) {
        console.log(`Card data not found for ${cardName}`);
        return;
    }

    // addCardToDeck関数を使ってカードを追加
    addCardToDeck(cardData);
}

// デッキ欄のカード下フリックでデッキから削除
function handleRemoveTouchEnd(event) {

    // タッチ終了時のY座標を取得し、フリックの距離を計算
    const touchEndY = event.changedTouches[0].clientY;
    const swipeDistance = touchEndY - touchStartY;

    // 下方向にスワイプされた場合、カードを削除
    if (swipeDistance > 50 && event.currentTarget) {
        removeCardFromDeck(event.currentTarget);
    }
}

// 削除の関数　
function removeCardFromDeck(cardElement) {
    const lrigDeck = document.getElementById('lrig-deck-cards');
    const mainDeck = document.getElementById('main-deck-cards');

    if (lrigDeck.contains(cardElement)) {
        lrigDeck.removeChild(cardElement);
        console.log('Card removed from Lrig Deck');
        sortLrigDeck();
    } else if (mainDeck.contains(cardElement)) {
        mainDeck.removeChild(cardElement);
        console.log('Card removed from Main Deck');
        sortMainDeck();
    }

    // ステータス欄を更新
    updateDeckStatus();
}

// ルリグデッキソート
function sortLrigDeck() {
    const lrigDeck = document.getElementById('lrig-deck-cards');
    const cardElements = Array.from(lrigDeck.children);

    // デバッグ: ソート前のカード情報
    console.log('Before sorting Lrig Deck:', cardElements.map(card => card.querySelector('p').textContent));

    const order = {
        'ルリグ': 1,
        'アシストルリグ': 2,
        'ピース': 3,
        'アーツ': 4
    };

    cardElements.sort((a, b) => {
        const aType = order[a.dataset.type] || 5;
        const bType = order[b.dataset.type] || 5;

        // デバッグ: 各カードの種類を表示
        console.log('aType:', aType, 'bType:', bType);

        return aType - bType;
    });

    lrigDeck.innerHTML = '';
    cardElements.forEach(element => lrigDeck.appendChild(element));

    // デバッグ: ソート後のカード情報
    console.log('After sorting Lrig Deck:', Array.from(lrigDeck.children).map(card => card.querySelector('p').textContent));
}

// メインデッキソート
function sortMainDeck() {
    const mainDeck = document.getElementById('main-deck-cards');
    const cardElements = Array.from(mainDeck.children);

    // デバッグ: ソート前のカード情報
    console.log('Before sorting Main Deck:', cardElements.map(card => ({
        name: card.querySelector('p').textContent,
        type: card.dataset.type,
        level: card.dataset.level
    })));

    const order = {
        'シグニ': 1,
        'スペル': 2,
        'サーバント': 3
    };

    cardElements.sort((a, b) => {
        const aType = order[a.dataset.type] || 4;
        const bType = order[b.dataset.type] || 4;

        if (aType !== bType) {
        return aType - bType;
        }

        // デバッグ: レベルと名前を確認
        const aLevel = parseInt(a.dataset.level, 10);
        const bLevel = parseInt(b.dataset.level, 10);
        console.log('aLevel:', aLevel, 'bLevel:', bLevel);

        if (aLevel !== bLevel) {
        return aLevel - bLevel;
        }

        // レベルが同じ場合、名前でソート
        const aName = a.querySelector('p').textContent;
        const bName = b.querySelector('p').textContent;

        return aName.localeCompare(bName);
    });

    mainDeck.innerHTML = '';
    cardElements.forEach(element => mainDeck.appendChild(element));

    // デバッグ: ソート後のカード情報
    console.log('After sorting Main Deck:', Array.from(mainDeck.children).map(card => ({
        name: card.querySelector('p').textContent,
        type: card.dataset.type,
        level: card.dataset.level
    })));
}