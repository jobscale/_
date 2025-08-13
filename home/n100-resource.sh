bash -c "ssh n100 LANG= mpstat 1 1 | awk '/Average/ {printf \"%d\n\", 100 - \$NF}'" > $HOME/.n100-cpu
bash -c "ssh n100 sensors | awk '/Package/ {print \$4}'" >> $HOME/.n100-cpu
mv $HOME/.n100-cpu $HOME/n100-cpu
