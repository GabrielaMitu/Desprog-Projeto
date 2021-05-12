const DELTA = 0.000001;

const SLIDE_WIDTH = 704;
const SLIDE_HEIGHT = 396;


function hide(element) {
    element.style.display = 'none';
}

function disable(button) {
    button.classList.add('disabled');
}

function enable(button) {
    button.classList.remove('disabled');
}

function createButton(controls, symbol) {
    let button = document.createElement('a');
    button.setAttribute('class', 'button');
    button.href = '';
    button.innerHTML = symbol;
    controls.append(button);
    return button;
}

function createJSON(slides, times, timeline) {
    if (timeline.length > 0 && times.length === slides.length) {
        let data = {
            'times': times,
            'timeline': timeline,
        };
        data = encodeURI(JSON.stringify(data, null, 4));
        let a = document.createElement('a');
        a.setAttribute('href', 'data:application/json,' + data);
        a.setAttribute('download', 'edit.json');
        a.click();
    }
}

function updateScale(slides, index, stamp, lecture) {
    slides[index].updateScale(stamp, lecture);
}

function updateTime(lecture, time) {
    lecture.setAttribute('automatic', '');
    lecture.currentTime = time;
}

function updateTimeFromSlides(slides, index, lecture) {
    let i = index - 1;
    let time;
    while (i > -1) {
        time = slides[i].time;
        if (!isNaN(time)) {
            break;
        }
        i--;
    }
    if (i === -1) {
        updateTime(lecture, 0);
    } else {
        updateTime(lecture, time);
    }
}

function updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter) {
    slides[index].element.style.display = 'block';
    updateScale(slides, index, stamp, lecture);
    if (isNaN(slides[index].time)) {
        if (lecture) {
            stamp.style.display = 'block';
            lecture.pause();
        }
        disable(playButton);
    } else {
        if (lecture) {
            hide(stamp);
        }
        enable(playButton);
    }
    if (index === 0) {
        disable(prevButton);
    } else {
        enable(prevButton);
    }
    if (index === slides.length - 1) {
        disable(nextButton);
    } else {
        enable(nextButton);
    }
    counter.innerHTML = `${index + 1}/${slides.length}`;
}

function updateAnimation(imgs, index, leftButton, rightButton, counter) {
    imgs[index].style.display = 'inline';
    if (index === 0) {
        disable(leftButton);
    } else {
        enable(leftButton);
    }
    if (index === imgs.length - 1) {
        disable(rightButton);
    } else {
        enable(rightButton);
    }
    counter.innerHTML = `${index + 1}/${imgs.length}`;
}


class Slide {
    constructor(element) {
        this.element = element;
        this.time = NaN;
        this.container = element.querySelector('div.slide-container');
        this.width = null;
    }

    transform(element, scale) {
        element.style.transform = `scale(${scale})`;
    }

    updateScale(stamp, lecture) {
        let rect = this.element.getBoundingClientRect();
        if (this.width !== rect.width) {
            this.width = rect.width;
            let scale = Math.min(rect.width / SLIDE_WIDTH, rect.height / SLIDE_HEIGHT);
            if (scale > DELTA) {
                this.transform(this.container, scale);
                if (lecture) {
                    this.transform(stamp, scale);
                    this.transform(lecture, scale);
                }
            }
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    let page = (new URLSearchParams(window.location.search)).get('slide');

    for (let code of document.querySelectorAll('code')) {
        hljs.highlightBlock(code);
    }

    let slides = [];
    let index = 0;
    let stamp;
    let lecture = document.querySelector('video.reader-lecture');

    for (let element of document.querySelectorAll('div.slide')) {
        slides.push(new Slide(element));
    }

    if (slides.length > 0) {
        let value = parseInt(page);

        if (!isNaN(value) && value > 0 && value <= slides.length) {
            index = value - 1;
        }

        let h1 = document.querySelector('h1');
        let parent = h1.parentElement;
        let reference = h1.nextElementSibling;

        let details = document.createElement('details');
        details.setAttribute('class', 'reader');

        let hr = document.createElement('hr');

        parent.insertBefore(details, reference);
        parent.insertBefore(hr, reference);

        let summary = document.createElement('summary');
        if (lecture) {
            summary.innerHTML = 'VideoSlides';
        } else {
            summary.innerHTML = 'Slides';
        }
        details.append(summary);

        let controls = document.createElement('div');
        controls.setAttribute('class', 'reader-controls');
        details.append(controls);

        let recIndicator = document.createElement('span');
        recIndicator.setAttribute('class', 'indicator');
        recIndicator.innerHTML = '⏺';
        controls.append(recIndicator);

        let prevButton = createButton(controls, '⏮');
        let playButton = createButton(controls, '▶');
        let pauseButton = createButton(controls, '⏸');
        let nextButton = createButton(controls, '⏭');
        let fullButton = createButton(controls, '⛶');

        let counter = document.createElement('span');
        counter.setAttribute('class', 'reader-counter');
        controls.append(counter);

        let display = document.createElement('div');
        display.setAttribute('class', 'reader-display');
        details.append(display);

        for (let slide of slides) {
            slide.element.remove();
            display.append(slide.element);
        }

        let times = document.querySelector('pre.times');
        if (times) {
            times = times.innerHTML.trim().split(/\s+/);
            for (let i = 0; i < slides.length && i < times.length; i++) {
                slides[i].time = parseFloat(times[i]);
            }
        }

        if (lecture) {
            stamp = document.createElement('div');
            stamp.setAttribute('class', 'stamp');
            display.append(stamp);

            display.append(lecture);

            updateTimeFromSlides(slides, index, lecture);

            lecture.addEventListener('play', function () {
                hide(playButton);
                pauseButton.style.display = 'inline';
                lecture.style.display = 'block';
            });

            lecture.addEventListener('pause', function () {
                hide(lecture);
                hide(pauseButton);
                playButton.style.display = 'inline';
            });

            lecture.addEventListener('timeupdate', function () {
                if (!lecture.seeking) {
                    let time = slides[index].time;
                    if (isNaN(time)) {
                        lecture.pause();
                        let i = index - 1;
                        while (i > -1) {
                            time = slides[i].time;
                            if (!isNaN(time)) {
                                break;
                            }
                            i--;
                        }
                        if (i === -1) {
                            updateTime(lecture, 0);
                        } else {
                            updateTime(lecture, time);
                        }
                    } else {
                        if (lecture.currentTime > time - DELTA) {
                            hide(slides[index].element);
                            if (index === slides.length - 1) {
                                lecture.pause();
                                updateTime(lecture, 0);
                                index = 0;
                            } else {
                                index++;
                            }
                            updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter);
                        }
                    }
                }
            });

            lecture.addEventListener('seeked', function () {
                if (lecture.hasAttribute('automatic')) {
                    lecture.removeAttribute('automatic');
                } else {
                    if (!lecture.seeking) {
                        let i = 0;
                        let last = 0;
                        while (i < slides.length) {
                            let time = slides[i].time;
                            if (!isNaN(time)) {
                                last = time;
                                if (time > lecture.currentTime + DELTA) {
                                    break;
                                }
                            }
                            i++;
                        }
                        if (i === slides.length) {
                            if (!lecture.paused) {
                                lecture.pause();
                            }
                            updateTime(lecture, last);
                        } else {
                            hide(slides[index].element);
                            index = i;
                            updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter);
                        }
                    }
                }
            });

            document.addEventListener('keydown', function (event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        prevButton.click();
                        break;
                    case 'ArrowRight':
                        nextButton.click();
                        break;
                    default:
                }
            });
        } else {
            hide(playButton);

            let shift = 0;
            let times = [];
            let start = null;

            let subtimes;
            let timeline = [];

            document.addEventListener('keydown', function (event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        if (start) {
                            let now = Date.now();
                            subtimes.push((start - now) / 1000);
                            start = now;
                        }
                        let length = times.length;
                        if (length > 0) {
                            let time = times.pop();
                            if (!isNaN(time)) {
                                let i = length - 2;
                                while (i > -1) {
                                    time = times[i];
                                    if (!isNaN(time)) {
                                        break;
                                    }
                                    i--;
                                }
                                if (i === -1) {
                                    shift = 0;
                                } else {
                                    shift = time;
                                }
                            }
                        }
                        prevButton.click();
                        break;
                    case 'ArrowRight':
                        if (times.length < slides.length) {
                            if (start) {
                                let now = Date.now();
                                shift += (now - start) / 1000;
                                times.push(shift);
                                start = now;
                                subtimes.push(shift);
                                if (times.length === slides.length) {
                                    counter.style.color = '#ff0000';
                                }
                            } else {
                                times.push(NaN);
                                createJSON(slides, times, timeline);
                            }
                        }
                        nextButton.click();
                        break;
                    case 'R':
                        if (start) {
                            hide(recIndicator);
                            timeline.push(subtimes);
                            start = null;
                            createJSON(slides, times, timeline);
                        } else {
                            start = Date.now();
                            subtimes = [];
                            recIndicator.style.display = 'inline';
                        }
                        break;
                    default:
                }
            });
        }

        hide(pauseButton);
        updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter);

        window.addEventListener('resize', function () {
            updateScale(slides, index, stamp, lecture);
        });

        details.addEventListener('toggle', function () {
            updateScale(slides, index, stamp, lecture);
        });

        playButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (lecture) {
                lecture.play();
            }
        });

        pauseButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (lecture) {
                lecture.pause();
            }
        });

        prevButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index > 0) {
                hide(slides[index].element);
                index--;
                if (lecture) {
                    updateTimeFromSlides(slides, index, lecture);
                }
                updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter);
            }
        });

        nextButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index < slides.length - 1) {
                hide(slides[index].element);
                if (lecture) {
                    let time = slides[index].time;
                    if (!isNaN(time)) {
                        updateTime(lecture, time);
                    }
                }
                index++;
                updateReader(slides, index, stamp, lecture, playButton, prevButton, nextButton, counter);
            }
        });

        fullButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (display.requestFullscreen) {
                display.requestFullscreen();
            } else if (display.webkitRequestFullScreen) {
                display.webkitRequestFullScreen();
            } else if (display.mozRequestFullScreen) {
                display.mozRequestFullScreen();
            } else if (display.msRequestFullscreen) {
                display.msRequestFullscreen();
            }
        });
    }

    let alerts = document.querySelectorAll('p.alert');

    if (alerts.length > 0) {
        let container = document.querySelector('div.container');
        let main = document.querySelector('main');

        for (let alert of alerts) {
            alert.remove();
            container.insertBefore(alert, main);
        }
    }

    for (let animation of document.querySelectorAll('div.animation')) {
        let imgs = animation.querySelectorAll('img.frame');
        let index = 0;

        let controls = document.createElement('div');
        controls.setAttribute('class', 'animation-controls');
        animation.append(controls);

        let leftButton = createButton(controls, '🡄');
        let counter = document.createElement('span');
        counter.setAttribute('class', 'animation-counter');
        controls.append(counter);
        let rightButton = createButton(controls, '🡆');

        updateAnimation(imgs, index, leftButton, rightButton, counter);

        leftButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index > 0) {
                hide(imgs[index]);
                index--;
                updateAnimation(imgs, index, leftButton, rightButton, counter);
            }
        });

        rightButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (index < imgs.length - 1) {
                hide(imgs[index]);
                index++;
                updateAnimation(imgs, index, leftButton, rightButton, counter);
            }
        });
    }

    let allDetails = document.querySelectorAll('details');

    let as = document.querySelectorAll('header > a');

    if (allDetails.length > 0) {
        for (let details of allDetails) {
            details.firstElementChild.addEventListener('mousedown', function (event) {
                event.preventDefault();
            });
        }

        as[0].addEventListener('click', function (event) {
            event.preventDefault();
            for (let details of allDetails) {
                details.setAttribute('open', '');
            }
        });
        as[1].addEventListener('click', function (event) {
            event.preventDefault();
            for (let details of allDetails) {
                details.removeAttribute('open');
            }
        });
    } else {
        hide(as[0]);
        hide(as[1]);
    }

    if (page || window.location.hash) {
        as[0].click();
    }
});
