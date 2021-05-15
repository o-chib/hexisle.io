'use strict'
const playButton = document.getElementById("playNow");
playButton.onclick = playNow;

const userGuide = document.getElementById("userGuide")
userGuide.onclick = userGuideRedirect;
const githubWiki = document.getElementById('githubWiki')
githubWiki.onclick = githubWikiRedirect;

function setGameStatus(status) {
    const serverStatus = document.createElement('span');

    if(status == 'OK') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-success serverStatus');
        playButton.setAttribute('title','Game is Online :)');
        playButton.removeAttribute('disabled');
    } else if(status == 'ERROR') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-danger serverStatus');
        playButton.setAttribute('title','Game is Offline :(');
        // playButton.setAttribute('disabled', 'true');
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    serverStatus.setAttribute('role', 'status');
    serverStatus.setAttribute('aria-hidden', 'true');
    playButton.insertBefore(serverStatus, playButton.firstChild);

    // const newContent = document.createTextNode("Play Now");
    // playButton.appendChild(newContent);
}

function playNow() {
    window.location.href="https://play.hexisle.io/";
}

function userGuideRedirect() {
    console.log("userGuide");
    window.open('https://docs.google.com/document/d/1YHrR4WNBf9_-gPamyvvTtFYI9yxm49cz7WaIZMAzbWY/edit?usp=sharing');
}

function githubWikiRedirect() {
    window.open('https://github.com/o-chib/teamIO-project/wiki');
}

//  Server Online Check
// -----------------------------------------------

checkServerStatus();
function checkServerStatus()
{
    let img = document.body.appendChild(document.createElement("img"));
    img.onload = function()
    {
        setGameStatus("OK");
    };
    img.onerror = function()
    {
        setGameStatus("ERROR");
    };
    document.body.removeChild(img)
    img.src = "https://play.hexisle.io/assets/help.png";
    // img.src = "https://raw.githubusercontent.com/o-chib/teamIO-project/main/public/assets/base_red.png?token=AHYXK3SYAE26AUBRMPZR3HTAVBMDS";
}