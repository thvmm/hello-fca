angular.module('myApp', ['angularAudioRecorder']).controller('customerController', function ($scope, $http) {
    $("#btn-input").keyup(function (event) {
        if (event.keyCode == 13) {
            $("#btn-chat").click();
        }
    });

    $scope.sendTopicMessage = function (message) {
        $scope.userMessage.text = message;
        $scope.sendMessage();
    };

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();
    navigator.getUserMedia({audio: true}, function(stream) {
        var microphone = context.createMediaStreamSource(stream);
        var filter = context.createBiquadFilter();

        // microphone -> filter -> destination.
        microphone.connect(filter);
        filter.connect(context.destination);
        $scope.recorder = new Recorder(microphone);
    }, function (e) {
        console.log(e);
    });

    $scope.startRecording = function() {
        $scope.recorder && $scope.recorder.record();
        console.log('Recording...');
    }

    $scope.stopRecording = function(button) {
        $scope.recorder && $scope.recorder.stop();
        console.log('Stopped recording.');
        $scope.recorder.exportWAV(function (blob) {
            console.log(blob);

            var fd = new FormData();
            fd.append('upl', blob, 'audio.wav');
            var config = { headers: { 'Content-Type': undefined } };
            var fd = new FormData();
            fd.append('fname', 'test.wav');
            fd.append('upl', blob);
            $.ajax({
                type: 'POST',
                url: '/api/stt',
                data: fd,
                processData: false,
                contentType: false
            }).done(function(data) {
                console.log(data);
            });


            var url = URL.createObjectURL(blob);
            var li = document.createElement('li');
            var au = document.createElement('audio');
            var hf = document.createElement('a');

            au.controls = true;
            au.src = url;
            hf.href = url;
            hf.download = new Date().toISOString() + '.wav';
            hf.innerHTML = hf.download;
            li.appendChild(au);
            li.appendChild(hf);
            recordingslist.appendChild(li);
        });
    }

    $scope.mycallback = function(e) {
        recorder.exportWAV(function(blob) {
            console.log(blob);
        });
    }

    $scope.messages = [];
    $scope.userMessage = {};
    $scope.userMessage.text = "";
    $scope.data = {};
    $scope.data.file = {};

    window.setInterval(function () {
        for (var i = 0; i < $scope.messages.length; i++) {
            $scope.messages[i].hourAnswerFilter = moment($scope.messages[i].hourAnswer).locale('pt').fromNow();
        }
        $scope.$apply();
    }, 10000);

    var actualContext;
    $http.post("/chat", {"input": {"text": ""}, "context": {}}).then(function (response) {
        var message = response.data.output.text[0];

        actualContext = response.data.context;
        // Os topicos vem "raw" do watson, precisamos torna-los texto "user friendly". Quando o 
        // usuario selecionar, deve automaticamente enviar um texto pro backend que dispara o fluxo
        //desejado. [existe um outro ponto de tratamento de topicos nesse codigo]
        var topics = [];
        var stepsToSolve = [];
        if (response.data.output.context) {
            topics = response.data.output.context.topics || [];
            stepsToSolve = response.data.output.context.stepsToSolve || [];
            if (topics.length == 0 && response.data.output.context.yes_no) {
                topics.push("Sim", "Não");
            }
        }

        var hourAnswer = new Date();

        $scope.messages.push({
            author: "Troubleshooting FCA",
            message: message,
            isUser: false,
            hourAnswer: hourAnswer,
            hourAnswerFilter: moment(hourAnswer).locale('pt').fromNow(),
            topics: topics,
            stepsToSolve: stepsToSolve
        });
    });

    $scope.emptyMessage = function () {
        return $scope.userMessage.text === "";
    }

    $scope.sendMessage = function () {
        if (!$scope.emptyMessage()) {
            var message;

            var originalMessage = angular.copy($scope.userMessage.text);
            if ($scope.userMessage.text === "Quero ver meus contatos do iPhone no Outlook") {
                var userMessage = "sync_contacts_iphone_to_outlook";
            } else if ($scope.userMessage.text === "Quero ver meus contatos do Outlook no iPhone") {
                var userMessage = "sync_contacts_outlook_to_iphone";
            } else {
                var userMessage = angular.copy($scope.userMessage.text);
            }

            $scope.userMessage.text = "";

            var hourAnswer = new Date();
            $scope.messages.push({
                author: "Tiago Moura",
                message: originalMessage,
                isUser: true,
                hourAnswer: hourAnswer,
                hourAnswerFilter: moment(hourAnswer).locale('pt').fromNow()
            });

            $http.post("/chat", {"input": {"text": userMessage}, "context": actualContext}).then(function (response) {
                actualContext = response.data.context;
                var topics = [];
                var stepsToSolve = [];
                if (response.data.output.context) {
                    topics = response.data.output.context.topics || [];
                    stepsToSolve = response.data.output.context.stepsToSolve || [];

                    if (topics.length == 0 && response.data.output.context.yes_no) {
                        topics.push("Sim", "Não");
                    }
                }

                for (var i = 0; i < response.data.output.text.length; i++) {
                    message = response.data.output.text[i];

                    var hourAnswer = new Date();

                    if (i > 0) stepsToSolve = [];
                    $scope.messages.push({
                        author: "Troubleshooting FCA",
                        message: message,
                        isUser: false,
                        hourAnswer: hourAnswer,
                        hourAnswerFilter: moment(hourAnswer).locale('pt').fromNow(),
                        topics: topics,
                        stepsToSolve: stepsToSolve
                    });
                }
            });
        }
    };
});