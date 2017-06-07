
class DevicesCtrl {
    constructor($scope, $state, DeviceData, handleData) {
        'ngInject';

        this.$state = $state;
        this.handleData = handleData;
        $scope.dev = devId => DeviceData.devices[devId];
        $scope.cell = id => DeviceData.cell(id);
        $scope.deviceIds = () => Object.keys(DeviceData.devices).sort();
        console.log("+++++++++.devices",DeviceData.devices);

    }

    copy(device, control) {
        if (/*device || */control) this.handleData.copyToClipboard(/*device + '/' +*/ control)
    }

    redirect(contr) {
        var [device,control] = contr.split('/');
        this.$state.go('historySample', {device, control, start: '-', end: '-'})
    }
}

//-----------------------------------------------------------------------------
export default angular
    .module('homeuiApp.devices', [])
    .controller('DevicesCtrl', DevicesCtrl);
