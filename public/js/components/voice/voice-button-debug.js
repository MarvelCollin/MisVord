window.debugVoiceButtons = function () {
  const buttonIds = [
    "micBtn",
    "videoBtn",
    "deafenBtn",
    "screenBtn",
    "ticTacToeBtn",
    "disconnectBtn",
  ];
  const issues = [];

  buttonIds.forEach((btnId) => {
    const btn = document.getElementById(btnId);
    const icon = btn?.querySelector("i");

    if (!btn) {
      issues.push(`${btnId}: Element not found`);
      return;
    }

    const rect = btn.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;

    if (!isVisible) {
      issues.push(
        `${btnId}: Not visible (${Math.round(rect.width)}x${Math.round(
          rect.height
        )})`
      );
    }

    const computedStyles = window.getComputedStyle(btn);

    if (
      computedStyles.backgroundColor === "rgba(0, 0, 0, 0)" ||
      computedStyles.backgroundColor === "transparent"
    ) {
      issues.push(`${btnId}: No background color applied`);
    }

    if (computedStyles.cursor !== "pointer") {
      issues.push(`${btnId}: Cursor not set to pointer`);
    }

    if (icon) {
      const iconStyles = window.getComputedStyle(icon);
      const iconContent = window.getComputedStyle(icon, "::before").content;

      if (iconContent === "none" || iconContent === '""') {
        issues.push(`${btnId}: FontAwesome icon not loading`);
      }
    } else {
      issues.push(`${btnId}: Icon element missing`);
    }

    const hasClickListener =
      btn.onclick !== null ||
      btn.addEventListener.toString().includes("click") ||
      btn.outerHTML.includes("onclick");

    const hasTailwindClasses =
      btn.className.includes("bg-[") || btn.className.includes("hover:bg-[");

    if (
      hasTailwindClasses &&
      computedStyles.backgroundColor === "rgba(0, 0, 0, 0)"
    ) {
      issues.push(`${btnId}: Tailwind classes present but not applied`);
    }
  });

  const testElement = document.createElement("div");
  testElement.className = "bg-red-500 w-10 h-10";
  testElement.style.position = "absolute";
  testElement.style.left = "-9999px";
  document.body.appendChild(testElement);

  const testStyles = window.getComputedStyle(testElement);
  const tailwindWorking =
    testStyles.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    testStyles.width === "40px" &&
    testStyles.height === "40px";

  if (!tailwindWorking) {
    issues.push("Tailwind CSS not loading properly");
  }

  document.body.removeChild(testElement);

  const faTestElement = document.createElement("i");
  faTestElement.className = "fas fa-microphone";
  faTestElement.style.position = "absolute";
  faTestElement.style.left = "-9999px";
  document.body.appendChild(faTestElement);

  const faStyles = window.getComputedStyle(faTestElement, "::before");
  const faWorking =
    faStyles.content &&
    faStyles.content !== "none" &&
    faStyles.content !== '""';

  if (!faWorking) {
    issues.push("FontAwesome not loading properly");
  }

  document.body.removeChild(faTestElement);

  const cssLinks = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );
  const voiceCssLink = cssLinks.find((link) =>
    link.href.includes("voice-call-section.css")
  );

  if (voiceCssLink) {
    
  } else {
    issues.push("voice-call-section.css not found");
  }

  if (issues.length === 0) {
    
  } else {
    
    issues.forEach((issue, index) => {
      
    });

    if (issues.some((i) => i.includes("Tailwind"))) {
      
    }
    if (issues.some((i) => i.includes("FontAwesome"))) {
      
    }
    if (issues.some((i) => i.includes("not visible"))) {
      
    }
  }

  return {
    buttonCount: buttonIds.length,
    issuesFound: issues.length,
    issues: issues,
    tailwindWorking: tailwindWorking,
    fontAwesomeWorking: faWorking,
  };
};

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const results = window.debugVoiceButtons();
    if (results.issuesFound > 0) {
      
      if (window.fixVoiceButtons) {
        window.fixVoiceButtons();
      }
    }
  }, 2000);
});
