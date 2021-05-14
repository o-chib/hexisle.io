'use strict'
const playButton = document.getElementById("playNow");
playButton.onclick = playNow;

const userGuide = document.getElementById("userGuide")
userGuide.onclick = userGuideRedirect;
const githubWiki = document.getElementById('githubWiki')
githubWiki.onclick = githubWikiRedirect;

onLoad();

function onLoad() {
    let socket= io();

    socket.on(
        'RETURN_STATUS',
        setGameStatus.bind(this)
    );

    socket.emit('GIVE_STATUS');

    console.log('onLoad finished');
}

function setGameStatus(status) {
    const serverStatus = document.createElement('span');

    if(status == 'OK') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-success serverStatus');
        playButton.setAttribute('title','Game is Online :)');
    } else if(status == 'ERROR') {
        serverStatus.setAttribute('class', 'spinner-grow spinner-grow-sm me-2 text-danger serverStatus');
        playButton.setAttribute('title','Game is Offline :(');
        playButton.setAttribute('disabled','disabled');
    }

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
    
    serverStatus.setAttribute('role', 'status');
    serverStatus.setAttribute('aria-hidden', 'true');
    playButton.appendChild(serverStatus);

    const newContent = document.createTextNode("Play Now");
    playButton.appendChild(newContent);
}

function playNow() {
    window.location.href="game.html";
}

function userGuideRedirect() {
    console.log("userGuide");
    window.open('https://docs.google.com/document/d/1YHrR4WNBf9_-gPamyvvTtFYI9yxm49cz7WaIZMAzbWY/edit?usp=sharing');
}

function githubWikiRedirect() {
    window.open('https://github.com/o-chib/teamIO-project/wiki');
}
