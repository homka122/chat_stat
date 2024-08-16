# data from https://allisonhorst.github.io/palmerpenguins/

import matplotlib.pyplot as plt
import numpy as np
import fileinput

input = fileinput.input()
species = input.readline()[:-1].split(",")
perv = [int(x) for x in input.readline()[:-1].split(",")]
not_perv = [int(x) for x in input.readline()[:-1].split(",")]

penguin_means = {
    'Первокурсники': perv,
    'Второй курс+': not_perv,
}

x = np.arange(len(species))  # the label locations
width = 0.25  # the width of the bars
multiplier = 0

fig, ax = plt.subplots(layout='constrained')

for attribute, measurement in penguin_means.items():
    offset = width * multiplier
    rects = ax.bar(x + offset, measurement, width, label=attribute)
    ax.bar_label(rects, padding=3)
    multiplier += 1

# Add some text for labels, title and custom x-axis tick labels, etc.
ax.set_ylabel('Количество сообщений')
ax.set_title(f'Флудилка 3.0 ({species[0]} - {species[-1]})')
ax.set_xticks(x + width, species)
ax.legend(loc='upper left', ncols=3)
ax.set_ylim(0, 1400)

plt.show()