function getSelectedQuality(containerId) {
  console.log('saveEditModal', editingEntryId);
  const container = document.getElementById(containerId);
  if (!container) return null;
  const checked = container.querySelector('input[type="radio"]:checked');
  console.log('getSelectedQuality', containerId, checked);
  if (!checked) return null;
  return parseInt(checked.dataset.value);
}

function confirmSleepQualityModal() {
  console.log(getSelectedQuality('quality-modal-stars'), getSelectedQuality('times-awake'));
  finishSleepLog(getSelectedQuality('quality-modal-stars'), null, getSelectedQuality('times-awake'));

}

function openSleepQualityModal(context) {
  document.getElementById('sleep-quality-modal').style.display = 'flex';
  document.getElementById('quality-modal-context').value = context;
  //setRating('quality-modal-stars', 0);
}

function finishSleepLog(quality, tts, waso) {
    console.log(quality, tts, waso)
  const context = document.getElementById('quality-modal-context').value;
  if (context === 'auto') {
     console.log('auto')
    if (lastClosedSleepId !== null && quality !== null) {
      updateEntry(lastClosedSleepId, { quality , tts, waso});
    }
    lastClosedSleepId = null;
  } else {
    console.log('logging')
    logEntry({
      activity:   'Sleep',
      activityId: 'sleep',
      start:      getLogTime(),
      end:        getLogEndTime(),
      type:       'sleep',
      colour:     '#7b9cff',
      quality,
      tts,
      waso,
    });
    sleepSelectedInManual = false;
    updateSleepButton();
    showFeedback(document.getElementById('log-feedback'), 'Sleep logged!', '#7b9cff');
  }
  document.getElementById('sleep-quality-modal').style.display = 'none';
}

//  Star Rating 

function setRating(containerId, value) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.dataset.selected = value;
  const radio = container.querySelector(`input[data-value="${value}"]`);
  
  if (radio) radio.checked = true;
  console.log('setRating', containerId, value, radio);
}

