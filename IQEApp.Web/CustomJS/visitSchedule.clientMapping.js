// Call this when ControlNo is selected on UI to auto-fill client mapping
function fetchClientMappingByControlNo(controlNo, onSuccess, onError) {
    $.ajax({
        url: '/VisitSchedule/GetClientMappingByControlNo',
        type: 'GET',
        data: { controlNo: controlNo },
        success: function (resp) {
            if (resp && resp.success) {
                onSuccess(resp);
            } else {
                onError && onError(resp);
            }
        },
        error: function (xhr) {
            onError && onError(xhr);
        }
    });
}

// Example: when control dropdown changes
$(document).on('change', '#drpControlNo', function () {
    var controlNo = $(this).val();
    if (!controlNo) return;
    fetchClientMappingByControlNo(controlNo, function (resp) {
        if (resp.clientId && resp.clientUnitId) {
            // Set hidden fields or select values
            $('#ClientId').val(resp.clientId);
            $('#ClientUnitId').val(resp.clientUnitId);
            // Optionally trigger change to load units list
            $('#ClientId').trigger('change');
        }
    }, function () {
        // fallback handling
    });
});
