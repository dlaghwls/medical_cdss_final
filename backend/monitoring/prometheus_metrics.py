from prometheus_client import Gauge

my_custom_gauge = Gauge('my_custom_metric', '설명')

def set_metric(value):
    my_custom_gauge.set(value)