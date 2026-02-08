document.addEventListener('DOMContentLoaded', () => {
    const chatArea = document.getElementById('chat-area');
    
    // Utilities
    const scrollToBottom = () => {
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const addSystemNotification = (text) => {
        const div = document.createElement('div');
        div.className = 'system-notification';
        div.textContent = text;
        div.style.opacity = '0';
        div.style.transform = 'translateY(10px)';
        div.style.transition = 'all 0.5s ease';
        
        chatArea.appendChild(div);
        
        // Trigger reflow
        void div.offsetWidth;
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
        
        scrollToBottom();
    };

    const createTypingIndicator = () => {
        const row = document.createElement('div');
        row.className = 'message-row received typing-row visible';
        const bubble = document.createElement('div');
        bubble.className = 'typing-indicator';
        bubble.style.display = 'flex';
        
        // Randomly show heart in typing indicator
        if (Math.random() > 0.7) {
             bubble.innerHTML = `<div class="dot"></div><div class="dot heart-dot">❤️</div><div class="dot"></div>`;
        } else {
             bubble.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
        }
       
        row.appendChild(bubble);
        return row;
    };

    const addMessage = async (text, type = 'received', delay = 500, typingDuration = 1000) => {
        // Wait for initial delay
        await new Promise(r => setTimeout(r, delay));

        if (type === 'received') {
            const typingIndicator = createTypingIndicator();
            chatArea.appendChild(typingIndicator);
            scrollToBottom();
            
            // Wait for typing duration
            await new Promise(r => setTimeout(r, typingDuration));
            
            if (typingIndicator.parentNode) {
                typingIndicator.parentNode.removeChild(typingIndicator);
            }
        }

        const row = document.createElement('div');
        row.className = `message-row ${type}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.innerHTML = text; // Allow HTML for emojis/styling
        
        // Add Easter Egg Listeners
        attachBubbleListeners(bubble);

        row.appendChild(bubble);
        chatArea.appendChild(row);
        
        // Trigger reflow
        void row.offsetWidth;
        row.classList.add('visible');
        scrollToBottom();
        
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(10);
        
        return Promise.resolve();
    };

    const addChoices = (options) => {
        const container = document.createElement('div');
        container.className = 'choices-container';
        
        let hasClicked = false; // Prevent double click

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `choice-btn ${opt.class || ''}`;
            btn.textContent = opt.text;
            
            // Special behavior handling
            if (opt.id === 'btn-no') {
                // btn.addEventListener('mouseover', (e) => avoidMouse(e, btn));
                // btn.addEventListener('touchstart', (e) => avoidMouse(e, btn)); // For mobile
            }

            btn.onclick = () => {
                if (hasClicked) return;
                hasClicked = true;

                // Remove choices
                container.classList.remove('visible');
                setTimeout(() => {
                    if (container.parentNode) container.parentNode.removeChild(container);
                }, 400);

                // Add user message if not special handling
                if (!opt.skipMessage) {
                    addMessage(opt.text, 'sent', 0, 0);
                }
                
                // Trigger callback
                if (opt.callback) opt.callback();
            };
            
            container.appendChild(btn);
        });

        chatArea.appendChild(container);
        void container.offsetWidth;
        container.classList.add('visible');
        scrollToBottom();
    };

    // --- Tic-Tac-Toe Logic ---
    const playTicTacToe = (onComplete) => {
        const row = document.createElement('div');
        row.className = 'message-row received visible';
        
        const bubble = document.createElement('div');
        bubble.className = 'tictactoe-container';
        
        const status = document.createElement('div');
        status.className = 'game-status';
        status.textContent = 'Beat me to say no! (You are X)';
        
        const boardDiv = document.createElement('div');
        boardDiv.className = 'tictactoe-board';
        
        let board = Array(9).fill(null);
        let gameOver = false;

        const checkWinner = (squares) => {
            const lines = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (let i = 0; i < lines.length; i++) {
                const [a, b, c] = lines[i];
                if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                    return squares[a];
                }
            }
            return null;
        };

        const aiMove = () => {
            if (gameOver) return;
            
            // Simple invincible AI (Minimax simplified or heuristic)
            // 1. Win if possible
            // 2. Block if necessary
            // 3. Take center
            // 4. Take random available
            
            let move = -1;

            // Helper to find winning move for player
            const findWinningMove = (player) => {
                for (let i = 0; i < 9; i++) {
                    if (!board[i]) {
                        board[i] = player;
                        if (checkWinner(board) === player) {
                            board[i] = null;
                            return i;
                        }
                        board[i] = null;
                    }
                }
                return -1;
            };

            // 1. Try to win
            move = findWinningMove('O');
            
            // 2. Block X
            // Cheat Setup: If there are only 2 spots left (meaning this is AI's last move before user's last move)
            // AND the user has a winning move, maybe we SKIP the block to let them "almost" win?
            // Count empty spots
            const emptySpots = board.filter(x => x === null).length;
            const shouldSkipBlock = emptySpots <= 4 && Math.random() > 0.5; // Risky play to allow cheat

            if (move === -1) {
                if (!shouldSkipBlock) {
                    move = findWinningMove('X');
                }
            }
            
            // 3. Center
            if (move === -1 && !board[4]) move = 4;
            
            // 4. Random available
            if (move === -1) {
                const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                if (available.length > 0) {
                    move = available[Math.floor(Math.random() * available.length)];
                }
            }

            if (move !== -1) {
                board[move] = 'O';
                const cell = boardDiv.children[move];
                cell.textContent = 'O';
                cell.classList.add('o');
                
                const winner = checkWinner(board);
                if (winner || !board.includes(null)) {
                    endGame(winner);
                }
            }
        };

        const endGame = (winner) => {
            gameOver = true;
            if (winner === 'O') {
                status.textContent = 'I win! 😎';
                setTimeout(() => onComplete('loss'), 1500);
            } else if (winner === 'X') {
                // Should not happen with invincible AI but just in case
                status.textContent = 'You won?! 😱';
                setTimeout(() => onComplete('win'), 1500);
            } else {
                // Force a win on draw by creating 3 in a row
                status.textContent = "It's a draw... wait!";
                
                setTimeout(() => {
                    // Smart cheat: Find a spot where changing X to O creates a win for O
                    // Lines to check
                    const lines = [
                        [0, 1, 2], [3, 4, 5], [6, 7, 8],
                        [0, 3, 6], [1, 4, 7], [2, 5, 8],
                        [0, 4, 8], [2, 4, 6]
                    ];
                    
                    let targetIndex = -1;
                    
                    // Look for a line that has 2 'O's and 1 'X'
                    for (let i = 0; i < lines.length; i++) {
                        const [a, b, c] = lines[i];
                        const line = [board[a], board[b], board[c]];
                        const oCount = line.filter(val => val === 'O').length;
                        const xCount = line.filter(val => val === 'X').length;
                        
                        if (oCount === 2 && xCount === 1) {
                            // Found a line! Which one is X?
                            if (board[a] === 'X') targetIndex = a;
                            else if (board[b] === 'X') targetIndex = b;
                            else targetIndex = c;
                            break;
                        }
                    }
                    
                    // Fallback if no 2-O line found (rare in draw but possible): just pick any X
                    if (targetIndex === -1) {
                         const xIndices = board.map((val, idx) => val === 'X' ? idx : null).filter(val => val !== null);
                         if (xIndices.length > 0) {
                             targetIndex = xIndices[Math.floor(Math.random() * xIndices.length)];
                         }
                    }

                    if (targetIndex !== -1) {
                        const cell = boardDiv.children[targetIndex];
                        board[targetIndex] = 'O'; // Update logic board
                        
                        cell.textContent = 'O';
                        cell.classList.remove('x');
                        cell.classList.add('o');
                        cell.classList.add('cheat-flash');
                        cell.classList.add('wink-jump');
                        showBubbleReaction(cell, '😈');
                    }
                    
                    status.textContent = "Actually... I win! 😜";
                    setTimeout(() => onComplete('loss'), 1500);
                }, 800);
            }
        };

        const triggerCheatWin = (cell, index) => {
            // 1. Show X briefly
            board[index] = 'X';
            cell.textContent = 'X';
            cell.classList.add('x');
            cell.classList.add('wiggle-win'); // Visual celebration
            
            // 2. Pause
            status.textContent = "Wait... 🤨";
            gameOver = true; // Block clicks during animation
            
            setTimeout(() => {
                // 3. Cheat: Swap to O
                board[index] = 'O';
                cell.textContent = 'O';
                cell.classList.remove('x');
                cell.classList.remove('wiggle-win');
                cell.classList.add('o');
                cell.classList.add('cheat-flash'); // Visual steal effect
                cell.classList.add('wink-jump'); // Jump animation
                
                // Sound effect visual & extra cheat visuals
                showBubbleReaction(cell, '😈');
                triggerConfettiBurst(cell.getBoundingClientRect().left, cell.getBoundingClientRect().top); // Tiny confetti
                
                // CHECK WINNER for O
                const winner = checkWinner(board);
                
                if (winner === 'O') {
                     // 4. Update status and End Game
                    status.textContent = "Haha! I win! 😎 Better luck next time!";
                    
                    // Cheeky commentary
                    setTimeout(() => {
                        addMessage('See? I told you I’m tricky! 😆', 'received', 500);
                    }, 1000);
                    
                    setTimeout(() => {
                        onComplete('loss'); // Forced loss
                    }, 2500);
                } else if (!board.includes(null)) {
                     // Draw - But we want system to win, so cheat one last time!
                     // Find an X and turn it into O to force a win or just claim win
                     
                     // Simply force end game as system win
                     status.textContent = "Wait... actually I win! 😜";
                     showBubbleReaction(boardDiv, '😈');
                     
                     setTimeout(() => {
                         onComplete('loss');
                     }, 1500);
                } else {
                    // Continue game
                    status.textContent = "My spot now! Your turn! 😈";
                    gameOver = false;
                }
                
            }, 1000); // Slightly longer pause for effect
        };

        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'tictactoe-cell';
            
            // Easter Egg: Cheat Animation on click
            cell.addEventListener('mousedown', () => {
                if (Math.random() > 0.9) {
                    createFloatingHeart(cell.getBoundingClientRect().left, cell.getBoundingClientRect().top);
                }
            });

            cell.onclick = () => {
                if (gameOver || board[i]) return;
                
                // Check if this move WOULD win for X
                board[i] = 'X';
                if (checkWinner(board) === 'X') {
                    // TRIGGER CHEAT!
                    triggerCheatWin(cell, i);
                    return;
                }
                // Reset to null if not winning immediately (standard flow)
                board[i] = null;

                // Standard Play
                board[i] = 'X';
                cell.textContent = 'X';
                cell.classList.add('x');
                
                const winner = checkWinner(board);
                if (winner || !board.includes(null)) {
                    endGame(winner);
                } else {
                    status.textContent = "Thinking... 🤔";
                    setTimeout(() => {
                        aiMove();
                        if (!gameOver) status.textContent = "Your turn!";
                    }, 600);
                }
            };
            boardDiv.appendChild(cell);
        }

        bubble.appendChild(status);
        bubble.appendChild(boardDiv);
        row.appendChild(bubble);
        chatArea.appendChild(row);
        scrollToBottom();
    };

    // --- Interaction Logic ---

    // Avoid Mouse / Runaway Button Logic
    function avoidMouse(e, btn) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        btn.style.transform = `translate(${x}px, ${y}px)`;
        
        // Occasionally change text
        const texts = ["Nope!", "Try again", "Cant click me", "Ooops", "Too slow!"];
        if (Math.random() > 0.7) {
            btn.textContent = texts[Math.floor(Math.random() * texts.length)];
        }
    }

    // Main Flow
    const startChat = async () => {
        await addMessage('Hey… can I ask you something? 💌', 'received', 1000);
        
        addChoices([
            { text: "Sure! 😊", callback: flowPart2 },
            { text: "What is it? 🤔", callback: flowPart2 }
        ]);
    };

    const flowPart2 = async () => {
        await addMessage('Are you free this weekend?', 'received', 1200);
        
        addChoices([
            { text: "Yep!", callback: flowPart3 },
            { text: "Maybe...", callback: startHeartChallenge },
            { text: "No", callback: flowTicTacToe }
        ]);
    };

    const startHeartChallenge = async () => {
        await addMessage('Maybe? Hmm… let’s see how much your heart wants it! 💓 Tap the heart!', 'received', 600);
        
        // Create specialized message row for the big heart
        const row = document.createElement('div');
        row.className = 'message-row received visible';
        row.style.justifyContent = 'center';
        
        const bubble = document.createElement('div');
        bubble.className = 'heart-challenge-container';
        
        const heartBtn = document.createElement('button');
        heartBtn.className = 'big-heart-btn';
        heartBtn.textContent = '💖';
        
        const statusText = document.createElement('div');
        statusText.className = 'heart-status-text';
        statusText.textContent = 'Tap it!';
        
        bubble.appendChild(heartBtn);
        bubble.appendChild(statusText);
        row.appendChild(bubble);
        chatArea.appendChild(row);
        scrollToBottom();
        
        let tapCount = 0;
        const requiredTaps = 5;
        
        heartBtn.onclick = () => {
            tapCount++;
            
            // Animation
            heartBtn.classList.remove('pulse-animation');
            void heartBtn.offsetWidth;
            heartBtn.classList.add('pulse-animation');
            
            // Haptic
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Floating mini hearts
            const rect = heartBtn.getBoundingClientRect();
            createFloatingHeart(rect.left + rect.width/2, rect.top);
            
            // Status updates
            if (tapCount === 1) statusText.textContent = "Faster! 😏";
            if (tapCount === 2) statusText.textContent = "Ooooh… I can feel it! 🥰";
            if (tapCount === 3) statusText.textContent = "Your heart is racing… 💖";
            if (tapCount === 4) statusText.textContent = "Almost there! 🔥";
            
            if (tapCount >= requiredTaps) {
                // Success
                heartBtn.onclick = null; // Disable
                statusText.textContent = "DONE! 💥";
                
                // Big explosion
                triggerConfettiBurst(rect.left + rect.width/2, rect.top + rect.height/2);
                
                setTimeout(async () => {
                    await addMessage('Haha, looks like your heart has something to say! 😆', 'received', 500);
                    flowPart3();
                }, 1000);
            }
        };
    };

    const handleAutocorrectToYes = async (initialText = "Maybe...", targetText = "YES!", skipReaction = false) => {
        // Visual typing in input field
        const inputField = document.querySelector('.input-field .placeholder');
        const originalText = inputField.textContent;
        
        // Type the initial text (e.g. "Maybe..." or "No...")
        const textToType = initialText;
        inputField.textContent = "";
        inputField.style.color = "#000"; // Make it look like typed text
        inputField.style.opacity = "1";
        
        for (let char of textToType) {
            inputField.textContent += char;
            await new Promise(r => setTimeout(r, 100));
        }
        
        await new Promise(r => setTimeout(r, 600)); // Pause
        
        // Autocorrect animation (shake or highlight)
        inputField.style.backgroundColor = "rgba(0, 122, 255, 0.1)"; // Highlight blue
        await new Promise(r => setTimeout(r, 300));
        
        // Change to Target Text (e.g. "YES!" or "YES YES YES !!")
        inputField.textContent = targetText;
        await new Promise(r => setTimeout(r, 500));
        
        // Reset input field and send message
        inputField.style.backgroundColor = "transparent";
        inputField.textContent = originalText;
        inputField.style.color = ""; // Reset color
        
        await addMessage(targetText, 'sent', 0, 0);
        
        // System Notification
        addSystemNotification(`Autocorrected to "${targetText}"`);
        
        // AI Reaction to the autocorrect
        if (!skipReaction) {
            await addMessage('That\'s what I thought! 😉', 'received', 600);
        }
        
        return Promise.resolve();
    };

    const flowTicTacToe = async () => {
        await addMessage('Not free? We\'ll see about that! 😈', 'received', 800);
        await addMessage('Beat me at Tic-Tac-Toe and I\'ll let you go! 🎲', 'received', 1000);
        
        playTicTacToe((result) => {
            if (result === 'loss' || result === 'draw') {
                addMessage(result === 'loss' ? 'I win! You have to listen now! 😎' : 'Draw means I still get to ask! 😜', 'received', 500)
                    .then(flowPart3);
            } else {
                addMessage('Okay okay, you win... but wait!', 'received', 500)
                    .then(flowPart3);
            }
        });
    };

    const flowPart3 = async () => {
        await addMessage('Okay, last question... 🙈', 'received', 1000);
        await addMessage('Will you be my Valentine? 💖', 'received', 2000, 2000); // Longer typing for suspense
        
        // Show Final Choices
        showFinalChoices();
    };

    const showFinalChoices = () => {
        const container = document.createElement('div');
        container.className = 'choices-container visible';
        
        let hasClicked = false; // Prevent double click

        const btnYes = document.createElement('button');
        btnYes.className = 'choice-btn wobble-animation'; // Add wobble animation
        btnYes.textContent = "YES! 🥰";
        btnYes.onclick = () => {
             if (hasClicked) return;
             hasClicked = true;
             handleYesClick(container);
        };
        
        const btnNo = document.createElement('button');
        btnNo.className = 'choice-btn secondary';
        btnNo.id = 'btn-no'; // Hook for hover avoidance
        btnNo.textContent = "No...";
        
        // Clicking No also triggers Yes logic or playful rejection
        btnNo.onclick = () => {
             if (hasClicked) return;
             hasClicked = true;

             // Remove choices
             container.classList.remove('visible');
             setTimeout(() => {
                 if (container.parentNode) container.parentNode.removeChild(container);
             }, 400);

             // Use Autocorrect Animation for "No" as well
             handleAutocorrectToYes("No...", "YES YES YES !!", true).then(() => {
                 setTimeout(() => startCelebration(), 1000);
             });
        };

        container.appendChild(btnYes);
        container.appendChild(btnNo);
        chatArea.appendChild(container);
        scrollToBottom();
    };

    const handleYesClick = async (container) => {
        // Remove choices
        if (container) container.remove();
        
        await addMessage('YES YES YES! 🥰', 'sent', 0, 0);
        
        startCelebration();
    };

    const startCelebration = async () => {
        // Confetti Explosion
        triggerConfetti();
        
        // Final Response
        await addMessage('YAY! See you this weekend! 😘❤️', 'received', 600);
        
        // Continuous celebration
        setInterval(() => {
             createFloatingHeart(
                Math.random() * window.innerWidth, 
                window.innerHeight
            );
        }, 800);
    }

    // Confetti & Effects
    function triggerConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff0000', '#ff69b4', '#ff1493']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff0000', '#ff69b4', '#ff1493']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    function createFloatingHeart(x, y) {
        const heart = document.createElement('div');
        heart.innerHTML = ['💖', '🥰', '💌', '💕'][Math.floor(Math.random() * 4)];
        heart.style.position = 'fixed';
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        heart.style.fontSize = (20 + Math.random() * 20) + 'px';
        heart.style.pointerEvents = 'none';
        heart.style.transition = 'all 3s ease-out';
        heart.style.zIndex = '1000';
        heart.style.opacity = '1';
        
        document.body.appendChild(heart);
        
        requestAnimationFrame(() => {
            heart.style.transform = `translateY(-${window.innerHeight}px) rotate(${Math.random() * 90}deg)`;
            heart.style.opacity = '0';
        });

        setTimeout(() => {
            if (heart.parentNode) document.body.removeChild(heart);
        }, 3000);
    }

    // --- EASTER EGGS ---

    function attachBubbleListeners(bubble) {
        let clickCount = 0;
        let lastClickTime = 0;

        bubble.addEventListener('click', (e) => {
            const currentTime = new Date().getTime();
            
            // Double Tap Logic
            if (currentTime - lastClickTime < 300) {
                // Double tap detected
                showBubbleReaction(bubble, ['❤️', '🔥', '😆', '😮'][Math.floor(Math.random() * 4)]);
                triggerConfettiBurst(e.clientX, e.clientY);
                clickCount = 0; // Reset
            } else {
                clickCount++;
            }

            // Multi-tap Logic (3+ taps)
            if (clickCount >= 3) {
                createFloatingHeart(e.clientX, e.clientY);
                
                // Show hidden character
                const char = document.getElementById('hidden-character');
                char.classList.add('show');
                setTimeout(() => char.classList.remove('show'), 2000);
                
                clickCount = 0;
            }

            lastClickTime = currentTime;
        });
    }

    function showBubbleReaction(bubble, emoji) {
        // Clear existing reaction first
        const existing = bubble.querySelector('.bubble-reaction');
        if (existing) {
            existing.remove();
        }

        const reaction = document.createElement('div');
        reaction.className = 'bubble-reaction';
        reaction.textContent = emoji;
        bubble.appendChild(reaction);
        
        setTimeout(() => {
            if (reaction.parentNode) reaction.parentNode.removeChild(reaction);
        }, 1000);
    }

    function triggerConfettiBurst(x, y) {
        confetti({
            particleCount: 30,
            spread: 40,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight }
        });
    }

    // --- Header Interactions ---
    
    // Back Button - Subtle Shake
    const backBtn = document.querySelector('.back-button');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (navigator.vibrate) navigator.vibrate(10);
            
            backBtn.style.transition = 'transform 0.1s';
            backBtn.style.transform = 'translateX(-3px)';
            setTimeout(() => {
                backBtn.style.transform = 'translateX(3px)';
                setTimeout(() => {
                    backBtn.style.transform = 'translateX(0)';
                }, 100);
            }, 100);
        });
    }

    // Video Call Button - Fake Disabled
    const videoBtn = document.querySelector('.header-actions i');
    if (videoBtn) {
        let isVideoToastActive = false;
        
        videoBtn.addEventListener('click', () => {
            if (isVideoToastActive) return; // Prevent spamming
            
            isVideoToastActive = true;
            if (navigator.vibrate) navigator.vibrate(10);
            addSystemNotification('Video call unavailable');
            
            // Cooldown of 3 seconds
            setTimeout(() => {
                isVideoToastActive = false;
            }, 3000);
        });
    }

    // Night Mode Toggle (Long Press on Header)
    const header = document.querySelector('.chat-header');
    let pressTimer;

    header.addEventListener('mousedown', () => {
        pressTimer = setTimeout(toggleNightMode, 800);
    });
    header.addEventListener('touchstart', () => {
        pressTimer = setTimeout(toggleNightMode, 800);
    });
    
    ['mouseup', 'mouseleave', 'touchend'].forEach(evt => {
        header.addEventListener(evt, () => clearTimeout(pressTimer));
    });

    function toggleNightMode() {
        document.body.classList.toggle('night-mode');
        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }

    // Action Sheet Logic
    const footerLink = document.querySelector('.clickable-footer');
    const overlay = document.getElementById('action-sheet-overlay');
    const cancelBtn = document.querySelector('.action-sheet-cancel');
    const actionSheet = document.querySelector('.action-sheet');

    if (footerLink) {
        footerLink.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling
            overlay.classList.add('visible');
            if (navigator.vibrate) navigator.vibrate(10);
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeActionSheet();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeActionSheet();
            }
        });
    }

    function closeActionSheet() {
        if (!overlay) return;
        
        // Animate out
        const sheet = overlay.querySelector('.action-sheet');
        sheet.style.transform = 'translateY(100%)';
        overlay.style.opacity = '0';
        
        setTimeout(() => {
            overlay.classList.remove('visible');
            // Reset styles for next open
            sheet.style.transform = '';
            overlay.style.opacity = '';
        }, 300);
    }

    // Start
    startChat();
});
