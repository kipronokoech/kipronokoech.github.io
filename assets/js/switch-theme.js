const themeStylesheet = document.getElementById('theme');
    const storedTheme = localStorage.getItem('theme');
    if(storedTheme){
        themeStylesheet.href = storedTheme;
    }
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        // if it's light -> go dark
        if(themeStylesheet.href.includes('light')){
            themeStylesheet.href = 'dark-theme.css';
            // themeToggle.innerText = 'Toggle light mode';
        } else {
            // if it's dark -> go light
            themeStylesheet.href = 'light-theme.css';
            // themeToggle.innerText = 'Toggle dark mode';
        }
        // save the preference to localStorage
        localStorage.setItem('theme',themeStylesheet.href)  
    })
