import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots to the auth gate without throwing', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartHealthRoomApp());

    // Before the stored-session check resolves, a loading indicator is shown.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
