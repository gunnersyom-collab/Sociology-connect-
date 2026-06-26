function searchFunction() {
    let input = document.getElementById('search-bar').value.toLowerCase();
    let sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        if (section.innerText.toLowerCase().includes(input)) {
            section.style.display = "block";
        } else {
            section.style.display = "none";
        }
    });
}
