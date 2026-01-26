fetch("http://localhost:8080/api/leaderboard")
  .then(res => res.json())
  .then(data => {
    const ul = document.getElementById("list");
    data.forEach(e => {
      const li = document.createElement("li");
      li.textContent = `${e.username} - ${e.score} (${e.gameMode})`;
      ul.appendChild(li);
    });
  });
