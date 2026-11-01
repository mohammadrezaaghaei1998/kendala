
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".kd-comment-form");
    if (!form) return;

    const button = form.querySelector(".kd-comment-submit");
    const label = button.querySelector(".kd-submit-label");
    const loading = button.querySelector(".kd-submit-loading");
    const textarea = form.querySelector('textarea[name="body"]');

    if (!button || !label || !loading || !textarea) return;

    let submitting = false;

    const MIN_LOADING_TIME = 2000;

    const sleep = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitting) return;

        const body = textarea.value.trim();

        if (body.length < 10 || body.length > 3000) {
            window.showToast(
                "Your comment must contain between 10 and 3000 characters.",
                "error",
                "Comment Error"
            );
            return;
        }

        submitting = true;
        button.disabled = true;
        label.hidden = true;
        loading.hidden = false;
        button.setAttribute("aria-busy", "true");
        const startTime = performance.now();
        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json"
                },
                redirect: "manual"
            });

            if (response.status === 0 || response.status === 401) {
                throw new Error("Please sign in again to submit your comment.");
            }

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    "The server did not return a valid response. Please try again."
                );
            }

            const data = await response.json();
            const elapsed = performance.now() - startTime;

            if (elapsed < MIN_LOADING_TIME) {
                await sleep(MIN_LOADING_TIME - elapsed);
            }

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to submit your comment."
                );
            }

            textarea.value = "";

            window.showToast(
                data.message ||
                "Your comment has been submitted and is awaiting approval.",
                "success",
                "Comment Submitted"
            );

        } catch (error) {

            const elapsed = performance.now() - startTime;

            if (elapsed < MIN_LOADING_TIME) {
                await sleep(MIN_LOADING_TIME - elapsed);
            }

            window.showToast(
                error.message || "Connection error. Please try again.",
                "error",
                "Comment Error"
            );

        } finally {
            submitting = false;
            button.disabled = false;
            label.hidden = false;
            loading.hidden = true;
            button.removeAttribute("aria-busy");
        }
    });
});
