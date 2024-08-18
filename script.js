document.getElementById('leftText').addEventListener('input', function() {
    document.getElementById('rightText').value = this.value;
});
