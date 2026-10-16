import sys
p = 'Alerts.js'
s = open(p, encoding='utf-8').read()

old = """    alerts.forEach(function(alert) {
        var pair = pairMap[alert.pair];
        if (!pair) return;
        if (alert.frequency === 'Once Per Bar Close') {
            var justClosed = _alUpdateBarState(alert);
            if (!justClosed) return;
        }
        if (_alConditionMet(alert, pair) && shouldFire(alert)) {
            _alFireAlert(alert, pair);
        }
    });
"""
new = """    alerts.forEach(function(alert) {
        var pair = pairMap[alert.pair];
        if (!pair) return;
        var stKey = alert.id + ':' + alert.condition + ':' + alert.targetPrice;
        var met = !!_alConditionMet(alert, pair);
        var prev = AL_PREV_MET[stKey];
        AL_PREV_MET[stKey] = met;
        if (prev === undefined) return; // pehli reading sirf baseline, fire nahi
        if (alert.frequency === 'Once Per Bar Close') {
            var justClosed = _alUpdateBarState(alert);
            if (!justClosed || !met) return;
        } else if (!(met && prev === false)) {
            return; // sirf false -> true cross par fire
        }
        if (shouldFire(alert)) {
            _alFireAlert(alert, pair);
            if ((alert.frequency || 'Only Once') === 'Only Once') {
                try {
                    var all = alLoadAlerts();
                    var x = all.find(function(q) { return q.id === alert.id; });
                    if (x) { x.active = false; alSaveAlerts(all); if (typeof render === 'function') render(); }
                } catch (e) {}
            }
        }
    });
"""
if old not in s:
    sys.exit('ERROR: checkAllAlerts block nahi mila, kuch change nahi kiya')
s = s.replace(old, new, 1)

hook = "function checkAllAlerts(pairsData) {"
if hook not in s:
    sys.exit('ERROR: checkAllAlerts nahi mila')
s = s.replace(hook, "var AL_PREV_MET = {};\n\n" + hook, 1)

open(p, 'w', encoding='utf-8').write(s)
print('OK')
