// كلاس إدارة اللعبة الرئيسي
class GiftExchangeGame {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.maxRounds = 10;
        this.currentPhase = 'setup';
        this.gameState = {
            gifts: {},
            receivedGifts: {},
            scores: {},
            roundResults: {},
            partnerships: {}, // partnerships[round] = [{player1, player2}, ...]
            resources: {} // resources[playerId] = {bombs: 10, points: 20}
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showScreen('startScreen');
    }
    
    setupEventListeners() {
        // أزرار اختيار عدد اللاعبين
        document.querySelectorAll('.count-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.count-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.setupPlayersForm(parseInt(e.currentTarget.dataset.count));
            });
        });
        
        // بدء اللعبة
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // إعداد الهدايا
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                this.handleGiftContentSelection(e.target);
            }
        });
        
        document.getElementById('confirmGiftsBtn').addEventListener('click', () => {
            this.confirmGifts();
        });
        
        // اختيار الهدايا المستلمة
        document.addEventListener('click', (e) => {
            if (e.target.closest('.received-gift-box')) {
                this.toggleGiftSelection(e.target.closest('.received-gift-box'));
            }
        });
        
        document.getElementById('openSelectedBtn').addEventListener('click', () => {
            this.openSelectedGifts();
        });
        
        document.getElementById('skipAllBtn').addEventListener('click', () => {
            this.skipAllGifts();
        });
        
        // الجولة التالية
        document.getElementById('nextRoundBtn').addEventListener('click', () => {
            this.nextRound();
        });
        
        // لعبة جديدة
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // قواعد اللعبة
        document.getElementById('rulesBtn').addEventListener('click', () => {
            document.getElementById('rulesModal').style.display = 'block';
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('rulesModal').style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('rulesModal')) {
                document.getElementById('rulesModal').style.display = 'none';
            }
        });
        
        // مشاركة النتائج
        document.getElementById('shareResultsBtn').addEventListener('click', () => {
            this.shareResults();
        });
        
        // قائمة اللعبة
        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('menuModal').style.display = 'flex';
        });
        
        document.getElementById('closeMenuBtn').addEventListener('click', () => {
            document.getElementById('menuModal').style.display = 'none';
        });
        
        document.getElementById('closeRulesBtn').addEventListener('click', () => {
            document.getElementById('rulesModal').style.display = 'none';
        });
        
        // إغلاق النوافذ عند النقر خارجها
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('menuModal')) {
                document.getElementById('menuModal').style.display = 'none';
            }
            if (e.target === document.getElementById('rulesModal')) {
                document.getElementById('rulesModal').style.display = 'none';
            }
        });
    }
    
    setupPlayersForm(playerCount) {
        const container = document.getElementById('playersGrid');
        container.innerHTML = '';
        
        for (let i = 1; i <= playerCount; i++) {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-input-card';
            playerCard.innerHTML = `
                <input type="text" class="player-input" placeholder="اسم اللاعب ${i}" 
                       data-player="${i}" value="لاعب ${i}">
                <div class="ai-toggle">
                    <input type="checkbox" class="ai-checkbox" id="ai-${i}" data-player="${i}">
                    <label for="ai-${i}">ذكاء اصطناعي</label>
                </div>
            `;
            container.appendChild(playerCard);
        }
    }
    
    startGame() {
        const playerInputs = document.querySelectorAll('.player-input');
        const aiCheckboxes = document.querySelectorAll('.ai-checkbox');
        
        this.players = [];
        this.gameState.scores = {};
        this.gameState.roundResults = {};
        
        playerInputs.forEach((input, index) => {
            const playerName = input.value.trim() || `لاعب ${index + 1}`;
            const isAI = aiCheckboxes[index].checked;
            const playerId = `player_${index + 1}`;
            
            this.players.push({
                id: playerId,
                name: playerName,
                isAI: isAI,
                avatar: playerName.charAt(0).toUpperCase()
            });
            
            this.gameState.scores[playerId] = 0;
            this.gameState.resources[playerId] = {
                bombs: 10,
                points: 20
            };
        });
        
        if (this.players.length < 4 || this.players.length % 2 !== 0) {
            alert('يجب أن يكون عدد اللاعبين زوجي (4، 6، أو 8)');
            return;
        }
        
        this.currentRound = 1;
        this.showScreen('gameScreen');
        this.setupGameBoard();
        this.startRound();
    }
    
    setupGameBoard() {
        this.updateGameHeader();
        this.updatePlayersBoard();
    }
    
    updateGameHeader() {
        document.getElementById('currentRound').textContent = this.currentRound;
        const progressPercent = ((this.currentRound - 1) / this.maxRounds) * 100;
        document.getElementById('progressFill').style.width = `${Math.max(0, progressPercent)}%`;
        
        const phaseTexts = {
            'gift-preparation': 'مرحلة إعداد الهدايا',
            'gift-receiving': 'مرحلة اختيار الهدايا',
            'results': 'مرحلة النتائج'
        };
        
        const phaseIcons = {
            'gift-preparation': 'fas fa-gift',
            'gift-receiving': 'fas fa-inbox',
            'results': 'fas fa-trophy'
        };
        
        document.getElementById('currentPhase').textContent = phaseTexts[this.currentPhase] || 'بدء الجولة';
        document.getElementById('phaseIcon').className = phaseIcons[this.currentPhase] || 'fas fa-play';
    }
    
    updatePlayersBoard() {
        const container = document.getElementById('playersList');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card-mini ${player.isAI ? 'ai' : ''} ${player.id === 'player_1' ? 'current' : ''}`;
            
            const statusText = player.isAI ? 'ذكاء اصطناعي' : 'لاعب بشري';
            
            // إظهار النقاط فقط في الجولة الأخيرة أو للاعب الحالي
            let scoreDisplay = '';
            if (this.currentRound >= this.maxRounds || player.id === 'player_1') {
                scoreDisplay = `${this.gameState.scores[player.id]} نقطة`;
            } else {
                scoreDisplay = 'نقاط مخفية';
            }
            
            playerCard.innerHTML = `
                <div class="mini-avatar">${player.avatar}</div>
                <div class="mini-player-info">
                    <div class="mini-player-name">${player.name}</div>
                    <div class="mini-player-status">${statusText}</div>
                    <div class="mini-player-score">${scoreDisplay}</div>
                </div>
            `;
            
            container.appendChild(playerCard);
        });
        
        // تحديث لوحة الموارد
        this.updateResourcesPanel();
    }
    
    updateResourcesPanel() {
        const resources = this.gameState.resources['player_1'];
        document.getElementById('bombsCount').textContent = resources.bombs;
        document.getElementById('pointsCount').textContent = resources.points;
        document.getElementById('myScore').textContent = this.gameState.scores['player_1'];
    }
    
    startRound() {
        this.currentPhase = 'gift-preparation';
        this.createPartnerships();
        this.updateGameHeader();
        this.showPartnersDisplay();
        this.showGiftSetupArea();
        this.setupAIGifts();
    }
    
    createPartnerships() {
        const playerIds = this.players.map(p => p.id);
        const partnerships = [];
        
        // إنشاء أزواج مختلفة في كل جولة
        let availablePlayers = [...playerIds];
        
        // خلط اللاعبين بناءً على رقم الجولة للحصول على توزيع مختلف
        for (let i = 0; i < this.currentRound; i++) {
            availablePlayers = this.shuffleArray(availablePlayers);
        }
        
        // تجميع اللاعبين في أزواج
        for (let i = 0; i < availablePlayers.length; i += 2) {
            if (i + 1 < availablePlayers.length) {
                partnerships.push({
                    player1: availablePlayers[i],
                    player2: availablePlayers[i + 1]
                });
            }
        }
        
        this.gameState.partnerships[this.currentRound] = partnerships;
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    getCurrentPartner() {
        const partnerships = this.gameState.partnerships[this.currentRound];
        if (!partnerships) return null;
        
        for (const partnership of partnerships) {
            if (partnership.player1 === 'player_1') {
                return this.players.find(p => p.id === partnership.player2);
            }
            if (partnership.player2 === 'player_1') {
                return this.players.find(p => p.id === partnership.player1);
            }
        }
        return null;
    }
    
    showPartnersDisplay() {
        const partner = this.getCurrentPartner();
        if (!partner) return;
        
        document.getElementById('partnershipDisplay').style.display = 'block';
        
        // عرض معلومات اللاعب الحالي
        const currentPlayer = this.players.find(p => p.id === 'player_1');
        document.getElementById('myAvatar').textContent = currentPlayer.avatar;
        document.getElementById('myName').textContent = currentPlayer.name;
        
        // عرض معلومات الشريك
        document.getElementById('partnerAvatar').textContent = partner.avatar;
        document.getElementById('partnerName').textContent = partner.name;
    }
    
    showGiftSetupArea() {
        document.getElementById('giftPreparationArea').style.display = 'block';
        document.getElementById('giftReceivingArea').style.display = 'none';
        document.getElementById('resultsArea').style.display = 'none';
        
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.option-btn.point').forEach(btn => {
            btn.classList.add('active');
        });
    }
    
    handleGiftContentSelection(button) {
        const giftBox = button.closest('.gift-box');
        const contentButtons = giftBox.querySelectorAll('.option-btn');
        
        contentButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // إضافة تأثير بصري للهدية
        this.animateGiftSelection(giftBox, button.dataset.content);
    }
    
    animateGiftSelection(giftBox, content) {
        const giftWrapper = giftBox.querySelector('.gift-wrapper');
        const giftBase = giftBox.querySelector('.gift-base');
        
        // تغيير لون الهدية حسب المحتوى
        if (content === 'point') {
            giftBase.style.background = 'linear-gradient(45deg, var(--success-color), #51cf66)';
        } else {
            giftBase.style.background = 'linear-gradient(45deg, var(--danger-color), #ff6b6b)';
        }
        
        // تأثير تحريك الغطاء
        const lid = giftBox.querySelector('.gift-lid');
        lid.style.transform = 'rotateX(-20deg) translateY(-5px)';
        
        setTimeout(() => {
            lid.style.transform = '';
        }, 300);
    }
    
    confirmGifts() {
        const humanPlayerGifts = this.getHumanPlayerGifts();
        
        if (humanPlayerGifts.length !== 3) {
            alert('يرجى اختيار محتوى الهدايا الثلاث');
            return;
        }
        
        // التحقق من توفر الموارد
        const playerResources = this.gameState.resources['player_1'];
        const bombsNeeded = humanPlayerGifts.filter(gift => gift === 'bomb').length;
        const pointsNeeded = humanPlayerGifts.filter(gift => gift === 'point').length;
        
        if (bombsNeeded > playerResources.bombs) {
            alert(`ليس لديك قنابل كافية! متوفر: ${playerResources.bombs}, مطلوب: ${bombsNeeded}`);
            return;
        }
        
        if (pointsNeeded > playerResources.points) {
            alert(`ليس لديك نقاط كافية! متوفر: ${playerResources.points}, مطلوب: ${pointsNeeded}`);
            return;
        }
        
        // خصم الموارد المستخدمة
        playerResources.bombs -= bombsNeeded;
        playerResources.points -= pointsNeeded;
        
        this.gameState.gifts['player_1'] = humanPlayerGifts;
        
        this.showLoading('جاري توزيع الهدايا...');
        
        setTimeout(() => {
            this.distributeGifts();
            this.hideLoading();
            this.showReceivedGiftsArea();
        }, 2000);
    }
    
    getHumanPlayerGifts() {
        const gifts = [];
        
        document.querySelectorAll('.gift-box').forEach(giftBox => {
            const activeBtn = giftBox.querySelector('.option-btn.active');
            if (activeBtn) {
                gifts.push(activeBtn.dataset.content);
            }
        });
        
        return gifts;
    }
    
    setupAIGifts() {
        this.players.forEach(player => {
            if (player.isAI) {
                this.gameState.gifts[player.id] = this.generateAIGifts(player);
            }
        });
    }
    
    generateAIGifts(player) {
        const gifts = [];
        for (let i = 0; i < 3; i++) {
            gifts.push(Math.random() > 0.3 ? 'point' : 'bomb');
        }
        return gifts;
    }
    
    distributeGifts() {
        this.gameState.receivedGifts = {};
        this.players.forEach(player => {
            this.gameState.receivedGifts[player.id] = [];
        });
        
        const partnerships = this.gameState.partnerships[this.currentRound];
        
        // توزيع الهدايا بين الشركاء
        partnerships.forEach(partnership => {
            const player1Id = partnership.player1;
            const player2Id = partnership.player2;
            
            const player1Gifts = this.gameState.gifts[player1Id] || [];
            const player2Gifts = this.gameState.gifts[player2Id] || [];
            
            // player1 يرسل هداياه لـ player2
            player1Gifts.forEach(giftContent => {
                this.gameState.receivedGifts[player2Id].push({
                    from: player1Id,
                    content: giftContent,
                    opened: false,
                    selected: false
                });
            });
            
            // player2 يرسل هداياه لـ player1
            player2Gifts.forEach(giftContent => {
                this.gameState.receivedGifts[player1Id].push({
                    from: player2Id,
                    content: giftContent,
                    opened: false,
                    selected: false
                });
            });
        });
        
        this.processAIChoices();
    }
    
    processAIChoices() {
        this.players.forEach(player => {
            if (player.isAI) {
                const receivedGifts = this.gameState.receivedGifts[player.id];
                const numToOpen = Math.floor(Math.random() * 3) + 1;
                const giftsToOpen = this.getRandomElements([0, 1, 2], numToOpen);
                
                giftsToOpen.forEach(index => {
                    receivedGifts[index].selected = true;
                    receivedGifts[index].opened = true;
                });
            }
        });
    }
    
    getRandomElements(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    showReceivedGiftsArea() {
        this.currentPhase = 'gift-receiving';
        this.updateGameHeader();
        
        document.getElementById('giftPreparationArea').style.display = 'none';
        document.getElementById('giftReceivingArea').style.display = 'block';
        document.getElementById('resultsArea').style.display = 'none';
        
        this.displayReceivedGifts();
    }
    
    displayReceivedGifts() {
        const container = document.getElementById('receivedGiftsGrid');
        container.innerHTML = '';
        
        const humanPlayerGifts = this.gameState.receivedGifts['player_1'];
        
        // إعادة تعيين حالة الاختيار
        humanPlayerGifts.forEach(gift => {
            gift.selected = false;
        });
        
        humanPlayerGifts.forEach((gift, index) => {
            const senderName = this.players.find(p => p.id === gift.from)?.name || 'مجهول';
            
            const giftElement = document.createElement('div');
            giftElement.className = 'received-gift-box';
            giftElement.dataset.giftIndex = index;
            giftElement.innerHTML = `
                <div class="mystery-gift">
                    <i class="fas fa-gift"></i>
                </div>
                <div class="gift-from">من: ${senderName}</div>
            `;
            
            container.appendChild(giftElement);
        });
        
        // تحديث العداد الأولي
        this.updateSelectedGiftsCount();
    }
    
    toggleGiftSelection(giftElement) {
        giftElement.classList.toggle('selected');
        
        const giftIndex = parseInt(giftElement.dataset.giftIndex);
        const gift = this.gameState.receivedGifts['player_1'][giftIndex];
        gift.selected = giftElement.classList.contains('selected');
        
        // تحديث عداد الهدايا المختارة
        this.updateSelectedGiftsCount();
    }
    
    updateSelectedGiftsCount() {
        const selectedCount = this.gameState.receivedGifts['player_1'].filter(gift => gift.selected).length;
        const openButton = document.getElementById('openSelectedBtn');
        
        if (selectedCount > 0) {
            openButton.innerHTML = `<i class="fas fa-box-open"></i><span>فتح ${selectedCount} هدايا</span>`;
            openButton.disabled = false;
            openButton.style.opacity = '1';
        } else {
            openButton.innerHTML = `<i class="fas fa-box-open"></i><span>اختر هدايا للفتح</span>`;
            openButton.disabled = true;
            openButton.style.opacity = '0.5';
        }
    }
    
    openSelectedGifts() {
        const humanPlayerGifts = this.gameState.receivedGifts['player_1'];
        const selectedGifts = humanPlayerGifts.filter(gift => gift.selected);
        
        if (selectedGifts.length === 0) {
            alert('يرجى اختيار هدية واحدة على الأقل للفتح!');
            return;
        }
        
        // التأكد من تعيين حالة فتح الهدايا بدقة
        humanPlayerGifts.forEach(gift => {
            // إذا كانت مختارة، تفتح. وإلا تبقى مغلقة
            gift.opened = gift.selected === true;
        });
        
        // إظهار رسالة تأكيد
        const selectedCount = selectedGifts.length;
        this.showLoading(`جاري فتح ${selectedCount} ${selectedCount === 1 ? 'هدية' : 'هدايا'}...`);
        
        setTimeout(() => {
            this.calculateRoundResults();
            this.hideLoading();
            this.showRoundResults();
            this.showGiftOpeningEffects();
        }, 2000);
    }
    
    skipAllGifts() {
        this.gameState.receivedGifts['player_1'].forEach(gift => {
            gift.opened = false;
            gift.selected = false;
        });
        
        this.showLoading('جاري معالجة الجولة...');
        
        setTimeout(() => {
            this.calculateRoundResults();
            this.hideLoading();
            this.showRoundResults();
        }, 1500);
    }
    
    calculateRoundResults() {
        if (!this.gameState.roundResults[this.currentRound]) {
            this.gameState.roundResults[this.currentRound] = {};
        }
        
        this.players.forEach(player => {
            const receivedGifts = this.gameState.receivedGifts[player.id];
            let roundScore = 0;
            const results = [];
            
            // حساب نقاط الهدايا المفتوحة
            receivedGifts.forEach(gift => {
                if (gift.opened) {
                    const points = gift.content === 'point' ? 1 : -1;
                    roundScore += points;
                    const senderName = this.players.find(p => p.id === gift.from)?.name || 'مجهول';
                    
                    results.push({
                        sender: senderName,
                        content: gift.content,
                        points: points,
                        type: 'opened'
                    });
                }
            });
            
            this.gameState.scores[player.id] += roundScore;
            this.gameState.roundResults[this.currentRound][player.id] = {
                roundScore: roundScore,
                totalScore: this.gameState.scores[player.id],
                results: results
            };
        });
        
        // معالجة الهدايا المرفوضة - تأثيرها على المرسلين
        this.processRejectedGifts();
        
        this.updatePlayersBoard();
    }
    
    processRejectedGifts() {
        this.players.forEach(player => {
            const receivedGifts = this.gameState.receivedGifts[player.id];
            
            // البحث عن الهدايا المرفوضة
            receivedGifts.forEach(gift => {
                if (!gift.opened) {
                    const senderId = gift.from;
                    const senderName = this.players.find(p => p.id === senderId)?.name || 'مجهول';
                    
                    // تحديد تأثير الهدية المرفوضة على المرسل
                    let points = 0;
                    let resultType = '';
                    
                    if (gift.content === 'point') {
                        // هدية نقطة مرفوضة = +1 للمرسل
                        points = 1;
                        resultType = 'rejected_point_returned';
                    } else if (gift.content === 'bomb') {
                        // قنبلة مرفوضة = -1 للمرسل (عقاب)
                        points = -1;
                        resultType = 'rejected_bomb_penalty';
                    }
                    
                    // إضافة النقاط للمرسل
                    this.gameState.scores[senderId] += points;
                    
                    // تحديث نتائج المرسل
                    if (!this.gameState.roundResults[this.currentRound][senderId]) {
                        this.gameState.roundResults[this.currentRound][senderId] = {
                            roundScore: 0,
                            totalScore: this.gameState.scores[senderId],
                            results: []
                        };
                    }
                    
                    this.gameState.roundResults[this.currentRound][senderId].roundScore += points;
                    this.gameState.roundResults[this.currentRound][senderId].totalScore = this.gameState.scores[senderId];
                    this.gameState.roundResults[this.currentRound][senderId].results.push({
                        receiver: player.name,
                        content: gift.content,
                        points: points,
                        type: resultType
                    });
                }
            });
        });
    }
    
    showRoundResults() {
        this.currentPhase = 'results';
        this.updateGameHeader();
        
        document.getElementById('giftPreparationArea').style.display = 'none';
        document.getElementById('giftReceivingArea').style.display = 'none';
        document.getElementById('resultsArea').style.display = 'block';
        
        this.displayRoundResults();
    }
    
    showGiftOpeningEffects() {
        const humanPlayerResults = this.gameState.roundResults[this.currentRound]['player_1'];
        
        humanPlayerResults.results.forEach((result, index) => {
            setTimeout(() => {
                if (result.points > 0) {
                    this.createParticleEffect('success', 100);
                    this.playSuccessSound();
                } else {
                    this.createParticleEffect('danger', 100);
                    this.playExplosionSound();
                }
            }, index * 500);
        });
    }
    
    createParticleEffect(type, count) {
        const container = document.getElementById('particlesContainer');
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = `particle ${type}`;
            
            // موقع عشوائي في الشاشة
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.top = Math.random() * window.innerHeight + 'px';
            
            container.appendChild(particle);
            
            // إزالة الجسيم بعد انتهاء الأنيميشن
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }
    
    playSuccessSound() {
        // يمكن إضافة ملف صوتي هنا
        console.log('تأثير صوتي: نجاح! 🎉');
    }
    
    playExplosionSound() {
        // يمكن إضافة ملف صوتي هنا
        console.log('تأثير صوتي: انفجار! 💥');
    }
    
    displayRoundResults() {
        const container = document.getElementById('resultsContent');
        container.innerHTML = '';
        
        const humanPlayerResults = this.gameState.roundResults[this.currentRound]['player_1'];
        const humanPlayerGifts = this.gameState.receivedGifts['player_1'];
        
        // عرض الهدايا المفتوحة
        const openedResults = humanPlayerResults.results.filter(result => result.type === 'opened');
        if (openedResults.length === 0) {
            const noResultsElement = document.createElement('div');
            noResultsElement.className = 'result-item neutral';
            noResultsElement.innerHTML = `
                <div class="result-icon">📦</div>
                <div class="result-text">لم تفتح أي هدايا هذه الجولة</div>
            `;
            container.appendChild(noResultsElement);
        } else {
            openedResults.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = `result-item ${result.points > 0 ? 'positive' : 'negative'}`;
                
                const contentIcon = result.content === 'point' ? '⭐' : '💥';
                const contentText = result.content === 'point' ? 'نقطة' : 'قنبلة';
                const pointsText = result.points > 0 ? '+1' : '-1';
                
                resultElement.innerHTML = `
                    <div class="result-icon">${contentIcon}</div>
                    <div class="result-text">
                        هدية من ${result.sender}: ${contentText} (${pointsText} نقطة)
                    </div>
                `;
                
                container.appendChild(resultElement);
            });
        }
        
        // عرض الهدايا المرتدة (التأثيرات على الهدايا المرفوضة)
        const rejectedResults = humanPlayerResults.results.filter(result => 
            result.type === 'rejected_point_returned' || result.type === 'rejected_bomb_penalty'
        );
        
        rejectedResults.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = `result-item ${result.points > 0 ? 'positive' : 'negative'}`;
            
            let icon, text;
            if (result.type === 'rejected_point_returned') {
                icon = '↩️';
                text = `نقطة عادت إليك من ${result.receiver} (رفض استلامها) (+1 نقطة)`;
            } else if (result.type === 'rejected_bomb_penalty') {
                icon = '⚠️';
                text = `عقاب قنبلة مرفوضة من ${result.receiver} (-1 نقطة)`;
            }
            
            resultElement.innerHTML = `
                <div class="result-icon">${icon}</div>
                <div class="result-text">${text}</div>
            `;
            
            container.appendChild(resultElement);
        });
        
        // عرض الهدايا المرفوضة (بدون كشف المحتوى)
        const rejectedGifts = humanPlayerGifts.filter(gift => !gift.opened);
        if (rejectedGifts.length > 0) {
            const rejectedElement = document.createElement('div');
            rejectedElement.className = 'result-item neutral';
            rejectedElement.innerHTML = `
                <div class="result-icon">❓</div>
                <div class="result-text">
                    تجاهلت ${rejectedGifts.length} هدايا - محتواها لا يزال مجهولاً! 🤔
                </div>
            `;
            container.appendChild(rejectedElement);
        }
        
        // ملخص الجولة
        const summaryElement = document.createElement('div');
        summaryElement.className = `result-item ${humanPlayerResults.roundScore >= 0 ? 'positive' : 'negative'}`;
        summaryElement.style.marginTop = '20px';
        summaryElement.style.fontWeight = 'bold';
        summaryElement.innerHTML = `
            <div class="result-icon">📊</div>
            <div class="result-text">
                <div>نقاط هذه الجولة: ${humanPlayerResults.roundScore >= 0 ? '+' : ''}${humanPlayerResults.roundScore}</div>
                <div style="margin-top: 5px;">إجمالي النقاط: ${humanPlayerResults.totalScore}</div>
            </div>
        `;
        container.appendChild(summaryElement);
    }
    
    nextRound() {
        if (this.currentRound >= this.maxRounds) {
            this.endGame();
        } else {
            this.currentRound++;
            this.startRound();
        }
    }
    
    endGame() {
        this.showScreen('finalScreen');
        this.displayFinalResults();
    }
    
    displayFinalResults() {
        const sortedPlayers = [...this.players].sort((a, b) => 
            this.gameState.scores[b.id] - this.gameState.scores[a.id]
        );
        
        this.displayPodium(sortedPlayers);
        this.displayDetailedScores(sortedPlayers);
    }
    
    displayPodium(sortedPlayers) {
        const container = document.getElementById('podium');
        container.innerHTML = '';
        
        const places = ['first', 'second', 'third'];
        const medals = ['🥇', '🥈', '🥉'];
        
        sortedPlayers.slice(0, 3).forEach((player, index) => {
            const placeElement = document.createElement('div');
            placeElement.className = `podium-place ${places[index]}`;
            placeElement.innerHTML = `
                <div class="place-number">${medals[index]}</div>
                <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">${player.name}</div>
                <div style="font-size: 1.5em; font-weight: bold;">${this.gameState.scores[player.id]} نقطة</div>
            `;
            container.appendChild(placeElement);
        });
    }
    
    displayDetailedScores(sortedPlayers) {
        const container = document.getElementById('finalScores');
        container.innerHTML = '';
        
        sortedPlayers.forEach((player, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'final-score-item';
            
            const rankText = index + 1;
            const aiText = player.isAI ? ' (AI)' : '';
            
            scoreElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; font-size: 1.2em;">#${rankText}</span>
                    <span style="font-size: 1.1em;">${player.name}${aiText}</span>
                </div>
                <div style="font-weight: bold; font-size: 1.2em; color: #667eea;">
                    ${this.gameState.scores[player.id]} نقطة
                </div>
            `;
            
            container.appendChild(scoreElement);
        });
    }
    
    shareResults() {
        const winner = this.players.reduce((prev, current) => 
            this.gameState.scores[prev.id] > this.gameState.scores[current.id] ? prev : current
        );
        
        const shareText = `🎮 نتائج لعبة تبادل الهدايا 🎮\n\n` +
                         `🏆 الفائز: ${winner.name} بـ ${this.gameState.scores[winner.id]} نقطة\n\n` +
                         `📊 النتائج النهائية:\n` +
                         this.players
                             .sort((a, b) => this.gameState.scores[b.id] - this.gameState.scores[a.id])
                             .map((p, i) => `${i + 1}. ${p.name}: ${this.gameState.scores[p.id]} نقطة`)
                             .join('\n') +
                         `\n\n🎯 لعبة استراتيجية ممتعة مع الأصدقاء!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'نتائج لعبة تبادل الهدايا',
                text: shareText
            });
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('تم نسخ النتائج للحافظة!');
            }).catch(() => {
                prompt('انسخ النتائج:', shareText);
            });
        }
    }
    
    resetGame() {
        this.currentRound = 1;
        this.currentPhase = 'setup';
        this.gameState = {
            gifts: {},
            receivedGifts: {},
            scores: {},
            roundResults: {},
            partnerships: {},
            resources: {}
        };
        
        this.showScreen('startScreen');
        
        document.querySelectorAll('.count-option').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.count-option[data-count="6"]').classList.add('active');
        this.setupPlayersForm(6);
        
        // إخفاء عرض الشركاء
        document.getElementById('partnershipDisplay').style.display = 'none';
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.getElementById(screenId).style.display = 'flex';
    }
    
    showLoading(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingScreen').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingScreen').style.display = 'none';
    }
}

// تهيئة اللعبة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new GiftExchangeGame();
});
