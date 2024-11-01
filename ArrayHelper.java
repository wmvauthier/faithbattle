import java.time.LocalTime;

public class ArrayHelper {

    private String[] arrayC; // Array "C" com 24 posições
    private String[] arrayA; // Array "A" com 48 posições
    private String[] arrayB; // Array "B" com 96 posições

    public ArrayHelper(String[] arrayC, String[] arrayA, String[] arrayB) {
        this.arrayC = arrayC;
        this.arrayA = arrayA;
        this.arrayB = arrayB;
    }

    // Função 1: Retorna o valor do array "C" que muda a cada 1 hora
    public String getFromArrayC() {
        int hour = LocalTime.now().getHour();
        return arrayC[hour];
    }

    // Função 2: Retorna o valor do array "A" que muda a cada 30 minutos
    public String getFromArrayA() {
        int hour = LocalTime.now().getHour();
        int minute = LocalTime.now().getMinute();
        int index = (hour * 2) + (minute / 30);
        return arrayA[index];
    }

    // Função 3: Retorna o valor do array "B" que muda a cada 15 minutos
    public String getFromArrayB() {
        int hour = LocalTime.now().getHour();
        int minute = LocalTime.now().getMinute();
        int index = (hour * 4) + (minute / 15);
        return arrayB[index];
    }

    public static void main(String[] args) {

        String[] arrayC = new String[24];
        String[] arrayA = new String[48];
        String[] arrayB = new String[96];

        for (int i = 0; i < arrayC.length; i++) arrayC[i] = "C" + i;
        for (int i = 0; i < arrayA.length; i++) arrayA[i] = "A" + i;
        for (int i = 0; i < arrayB.length; i++) arrayB[i] = "B" + i;

        ArrayHelper helper = new ArrayHelper(arrayC, arrayA, arrayB);

        System.out.println("Array C (por hora): " + helper.getFromArrayC());
        System.out.println("Array A (por 30 min): " + helper.getFromArrayA());
        System.out.println("Array B (por 15 min): " + helper.getFromArrayB());
    }
}
