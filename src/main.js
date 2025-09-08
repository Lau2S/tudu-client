import './styles/base.css';
import { initRouter } from './routes/route.js';

function initFormWatcher() {
  const form = document.getElementById("sing-form");
  if (!form) return; 


  const inputs = form.querySelectorAll("input");
  const submitBtn = document.getElementById("sing-button");

  function checkInputs() {
    let allFilled = true;
    inputs.forEach(input => {
      if (input.value.trim() === "") {
        allFilled = false;
      }
    });

    if (allFilled) {
      submitBtn.disabled = false;
      submitBtn.classList.add("enabled");
    } else {
      submitBtn.disabled = true;
      submitBtn.classList.remove("enabled");
    }
  }

  checkInputs();
  inputs.forEach(input => {
    input.addEventListener("input", checkInputs);
  });
}


const observer = new MutationObserver(() => {
  initFormWatcher();
});

observer.observe(document.body, { childList: true, subtree: true });

initRouter();